const { exec } = require("child_process");
const { readdir } = require("fs/promises");
const path = require("path");
const fs = require("fs");

/**
 * 在指定的目錄(cwd)中執行一個命令。
 * @param {string} command 要執行的命令。
 * @param {string} cwd 工作目錄。
 * @returns {Promise<string>} 成功時返回 stdout 或 stderr。
 */
function executeCommand(command, cwd) {
    const repoName = path.basename(cwd);
    return new Promise((resolve, reject) => {
        console.log(`[${repoName}] -> ${command}`);
        exec(command, { cwd }, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`[${repoName}] ${error.message}\n${stderr || stdout}`));
                return;
            }
            resolve(stdout || stderr);
        });
    });
}

/**
 * 【已重構】遞迴搜尋 Git 儲存庫，並加入深度限制。
 * @param {string} dir 要搜尋的目錄。
 * @param {number} maxDepth 最大搜尋深度。
 * @param {number} currentDepth 當前深度。
 * @returns {Promise<string[]>} 返回所有找到的 Git 儲存庫路徑。
 */
async function findGitRepositories(dir, maxDepth = 3, currentDepth = 0) {
    // 新增：深度限制檢查
    if (currentDepth > maxDepth) {
        return [];
    }

    const repos = [];
    const gitPath = path.join(dir, ".git");

    // 調整：先檢查當前目錄是否為 Git Repo
    if (fs.existsSync(gitPath)) {
        repos.push(dir);
        // 如果是 Repo，就不用再往下搜尋其子目錄，直接返回
        return repos;
    }

    // 如果當前目錄不是 Repo，才繼續搜尋其子目錄
    try {
        const entries = await readdir(dir, { withFileTypes: true });

        for (const dirent of entries) {
            if (dirent.isDirectory()) {
                // 沿用：跳過常見的非專案目錄
                const skipDirs = ["node_modules", ".vscode", "dist", "build", "target", ".next", ".nuxt", ".git"];
                if (skipDirs.includes(dirent.name)) {
                    continue;
                }

                const subDir = path.join(dir, dirent.name);
                try {
                    // 遞迴呼叫，並將深度加一
                    const subRepos = await findGitRepositories(subDir, maxDepth, currentDepth + 1);
                    repos.push(...subRepos);
                } catch (error) {
                    console.warn(`無法存取目錄: ${subDir} - ${error.message}`);
                }
            }
        }
    } catch (error) {
        console.warn(`讀取目錄時發生錯誤: ${dir} - ${error.message}`);
    }

    return repos;
}


/**
 * 處理單一 Git 儲存庫的 pull 任務。
 * @param {string} repoPath 儲存庫的絕對路徑。
 * @returns {Promise<{name: string, path: string, status: '✅ Success' | '⚠️ No Changes' | '❌ Failed', duration: number, message: string}>}
 */
async function pullRepository(repoPath) {
    const repoName = path.basename(repoPath);
    const relativePath = path.relative(process.cwd(), repoPath) || ".";
    const startTime = Date.now();

    try {
        const output = await executeCommand("git pull", repoPath);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        if (output.includes("Already up to date.")) {
            return { name: repoName, path: relativePath, status: "⚠️ No Changes", duration, message: "已經是最新版本。" };
        }

        return { name: repoName, path: relativePath, status: "✅ Success", duration, message: output.trim().split("\n").pop() };
    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        return { name: repoName, path: relativePath, status: "❌ Failed", duration, message: error.message.trim() };
    }
}

/**
 * 主執行函式
 */
async function runGitPuller() {
    const baseDir = ".";
    console.log("=".repeat(80));
    console.log(`在 '${path.resolve(baseDir)}' 中遞迴搜尋 Git 儲存庫並執行 'git pull'...`);
    console.log("=".repeat(80));

    try {
        const repoPaths = await findGitRepositories(baseDir);

        if (repoPaths.length === 0) {
            console.log("\n未找到任何 Git 儲存庫。");
            return;
        }

        console.log(`\n[發現儲存庫] 共找到 ${repoPaths.length} 個 Git 儲存庫：`);
        repoPaths.forEach((p, i) => console.log(`  ${i + 1}. ${path.relative(process.cwd(), p) || "."}`));

        console.log(`\n[啟動] 共 ${repoPaths.length} 個儲存庫開始並行 'git pull'...\n`);

        const pullPromises = repoPaths.map((p) => pullRepository(p));
        const results = await Promise.all(pullPromises);

        console.log("\n" + "=".repeat(80));
        console.log("🚀 所有儲存庫更新完畢 - 總結報告");
        console.log("=".repeat(80));

        let successCount = 0,
            noChangeCount = 0,
            failedCount = 0;

        results.forEach((result) => {
            const name = result.name.padEnd(20);
            const status = result.status.padEnd(15);
            const duration = `${result.duration}s`.padStart(8);
            const repoPath = result.path.padEnd(30);

            console.log(`路徑: ${repoPath} | 狀態: ${status} | 耗時: ${duration}`);

            if (result.status === "❌ Failed") {
                failedCount++;
                console.log(`  └─ 原因: ${result.message.replace(/\n/g, "\n         ")}\n`);
            } else if (result.status === "✅ Success") {
                successCount++;
                console.log(`  └─ 更新: ${result.message}\n`);
            } else {
                noChangeCount++;
            }
        });

        console.log("-".repeat(80));
        console.log(`總計: ${results.length} 個 | ✅ 成功: ${successCount} | ⚠️ 無變更: ${noChangeCount} | ❌ 失敗: ${failedCount}`);
        console.log("=".repeat(80));
    } catch (err) {
        console.error("執行過程中發生嚴重錯誤:", err);
    }
}

runGitPuller();