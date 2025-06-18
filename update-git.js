const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * 在指定的目錄(cwd)中執行一個命令。
 * @param {string} command 要執行的命令。
 * @param {string} cwd 工作目錄。
 * @returns {Promise<string>} 成功時返回 stdout。
 */
function executeCommand(command, cwd) {
    return new Promise((resolve, reject) => {
        exec(command, { cwd }, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`${error.message}\n${stderr || stdout}`));
                return;
            }
            // 成功時，返回 git 的輸出訊息
            resolve(stdout || stderr);
        });
    });
}

/**
 * 主執行函式
 */
async function updateCurrentRepo() {
    const repoPath = '.'; // 目標就是當前目錄
    const repoName = path.basename(path.resolve(repoPath)); // 取得資料夾名稱作為儲存庫名稱

    console.log('='.repeat(50));
    console.log(`🚀 開始更新儲存庫: ${repoName}`);
    console.log('='.repeat(50));

    // 步驟 1: 檢查當前目錄是否為 Git 儲存庫
    const gitPath = path.join(repoPath, '.git');
    if (!fs.existsSync(gitPath)) {
        console.error('❌ [錯誤] 此目錄不是一個 Git 儲存庫。');
        console.error(`   請確認 '${path.resolve(gitPath)}' 路徑是否存在。`);
        console.log('='.repeat(50));
        return; // 中斷執行
    }
    
    // 步驟 2: 執行 git pull
    const startTime = Date.now();
    try {
        console.log(`[執行中] -> git pull`);
        const output = await executeCommand('git pull', repoPath);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('\n' + '-'.repeat(50));
        console.log('📊 更新結果');
        console.log('-'.repeat(50));
        
        // 步驟 3: 顯示結果
        if (output.includes('Already up to date.')) {
            console.log(`🔵 狀態: 已經是最新版本 (No Changes)`);
        } else {
            console.log(`✅ 狀態: 更新成功 (Success)`);
            console.log(`📄 細節: ${output.trim().split('\n').pop()}`); // 取最後一行為摘要
        }
        console.log(`⏱️  耗時: ${duration} 秒`);

    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log('\n' + '-'.repeat(50));
        console.log('📊 更新結果');
        console.log('-'.repeat(50));
        console.log(`❌ 狀態: 更新失敗 (Failed)`);
        console.log(`📄 原因: ${error.message.trim()}`);
        console.log(`⏱️  耗時: ${duration} 秒`);
    } finally {
        console.log('='.repeat(50));
    }
}

// 執行主函式
updateCurrentRepo();