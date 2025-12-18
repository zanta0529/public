import React, { useState } from "react";
import { Upload, AlertCircle, CheckCircle2, Info } from "lucide-react";

const ImageQualityAnalyzer = () => {
    const [originalImage, setOriginalImage] = useState(null);
    const [compressedImage, setCompressedImage] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(false);

    // 載入圖片
    const loadImage = (file) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // 取得圖片像素資料
    const getImageData = (img) => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, img.width, img.height);
    };

    // 計算 MSE（Mean Squared Error）
    const calculateMSE = (data1, data2) => {
        let sum = 0;
        const pixels = data1.length / 4;

        for (let i = 0; i < data1.length; i += 4) {
            const r = data1[i] - data2[i];
            const g = data1[i + 1] - data2[i + 1];
            const b = data1[i + 2] - data2[i + 2];
            sum += (r * r + g * g + b * b) / 3;
        }

        return sum / pixels;
    };

    // 計算 PSNR（Peak Signal-to-Noise Ratio）
    const calculatePSNR = (mse) => {
        if (mse === 0) return Infinity;
        const maxPixelValue = 255;
        return 20 * Math.log10(maxPixelValue / Math.sqrt(mse));
    };

    // 計算 SSIM（Structural Similarity Index）
    const calculateSSIM = (data1, data2, width, height) => {
        const c1 = (0.01 * 255) ** 2;
        const c2 = (0.03 * 255) ** 2;

        let meanX = 0,
            meanY = 0,
            varX = 0,
            varY = 0,
            covar = 0;
        const pixels = width * height;

        // 計算平均值
        for (let i = 0; i < data1.length; i += 4) {
            const gray1 = (data1[i] + data1[i + 1] + data1[i + 2]) / 3;
            const gray2 = (data2[i] + data2[i + 1] + data2[i + 2]) / 3;
            meanX += gray1;
            meanY += gray2;
        }
        meanX /= pixels;
        meanY /= pixels;

        // 計算變異數和共變異數
        for (let i = 0; i < data1.length; i += 4) {
            const gray1 = (data1[i] + data1[i + 1] + data1[i + 2]) / 3;
            const gray2 = (data2[i] + data2[i + 1] + data2[i + 2]) / 3;
            varX += (gray1 - meanX) ** 2;
            varY += (gray2 - meanY) ** 2;
            covar += (gray1 - meanX) * (gray2 - meanY);
        }
        varX /= pixels;
        varY /= pixels;
        covar /= pixels;

        const ssim =
            ((2 * meanX * meanY + c1) * (2 * covar + c2)) / ((meanX ** 2 + meanY ** 2 + c1) * (varX + varY + c2));

        return ssim;
    };

    // 分析圖片
    const analyzeImages = async () => {
        if (!originalImage || !compressedImage) return;

        setLoading(true);
        try {
            const img1 = await loadImage(originalImage);
            const img2 = await loadImage(compressedImage);

            // 確保兩張圖片尺寸相同
            if (img1.width !== img2.width || img1.height !== img2.height) {
                alert("兩張圖片的尺寸必須相同！");
                setLoading(false);
                return;
            }

            const imageData1 = getImageData(img1);
            const imageData2 = getImageData(img2);

            const mse = calculateMSE(imageData1.data, imageData2.data);
            const psnr = calculatePSNR(mse);
            const ssim = calculateSSIM(imageData1.data, imageData2.data, img1.width, img1.height);

            // 計算檔案大小差異
            const sizeReduction = (((originalImage.size - compressedImage.size) / originalImage.size) * 100).toFixed(2);

            setMetrics({
                mse: mse.toFixed(4),
                psnr: psnr.toFixed(2),
                ssim: ssim.toFixed(4),
                originalSize: (originalImage.size / 1024).toFixed(2),
                compressedSize: (compressedImage.size / 1024).toFixed(2),
                sizeReduction: sizeReduction,
                width: img1.width,
                height: img1.height,
            });
        } catch (error) {
            console.error("分析錯誤：", error);
            alert("圖片分析失敗，請確認圖片格式正確");
        }
        setLoading(false);
    };

    // 處理檔案上傳
    const handleFileUpload = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            if (type === "original") {
                setOriginalImage(file);
            } else {
                setCompressedImage(file);
            }
        }
    };

    // 品質評級
    const getQualityRating = () => {
        if (!metrics) return null;

        const psnr = parseFloat(metrics.psnr);
        const ssim = parseFloat(metrics.ssim);

        let quality = "";
        let color = "";
        let icon = null;

        if (psnr >= 40 && ssim >= 0.98) {
            quality = "優秀";
            color = "text-green-600";
            icon = <CheckCircle2 className="w-5 h-5" />;
        } else if (psnr >= 35 && ssim >= 0.95) {
            quality = "良好";
            color = "text-blue-600";
            icon = <CheckCircle2 className="w-5 h-5" />;
        } else if (psnr >= 30 && ssim >= 0.9) {
            quality = "可接受";
            color = "text-yellow-600";
            icon = <Info className="w-5 h-5" />;
        } else {
            quality = "需改善";
            color = "text-red-600";
            icon = <AlertCircle className="w-5 h-5" />;
        }

        return { quality, color, icon };
    };

    const rating = getQualityRating();

    return (
        <div className="w-full max-w-4xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg">
            <div className="bg-white rounded-lg p-6 shadow-sm">
                <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">📊 圖片品質分析工具</h1>
                <p className="text-gray-600 mb-6">使用 PSNR、MSE、SSIM 指標量化分析圖片壓縮品質</p>

                {/* 上傳區域 */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                        <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <label className="cursor-pointer">
                            <span className="text-blue-600 font-semibold hover:text-blue-700">上傳原始圖片</span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, "original")}
                            />
                        </label>
                        {originalImage && <p className="text-sm text-green-600 mt-2">✓ {originalImage.name}</p>}
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                        <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <label className="cursor-pointer">
                            <span className="text-blue-600 font-semibold hover:text-blue-700">上傳壓縮圖片</span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, "compressed")}
                            />
                        </label>
                        {compressedImage && <p className="text-sm text-green-600 mt-2">✓ {compressedImage.name}</p>}
                    </div>
                </div>

                {/* 分析按鈕 */}
                <button
                    onClick={analyzeImages}
                    disabled={!originalImage || !compressedImage || loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? "分析中..." : "開始分析"}
                </button>

                {/* 分析結果 */}
                {metrics && (
                    <div className="mt-8 space-y-6">
                        {/* 整體評級 */}
                        <div
                            className={`bg-gradient-to-r ${
                                rating.color === "text-green-600"
                                    ? "from-green-50 to-emerald-50"
                                    : rating.color === "text-blue-600"
                                    ? "from-blue-50 to-cyan-50"
                                    : rating.color === "text-yellow-600"
                                    ? "from-yellow-50 to-amber-50"
                                    : "from-red-50 to-orange-50"
                            } p-6 rounded-lg border-2 ${
                                rating.color === "text-green-600"
                                    ? "border-green-200"
                                    : rating.color === "text-blue-600"
                                    ? "border-blue-200"
                                    : rating.color === "text-yellow-600"
                                    ? "border-yellow-200"
                                    : "border-red-200"
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-1">壓縮品質評級</h3>
                                    <div className={`flex items-center gap-2 ${rating.color} text-2xl font-bold`}>
                                        {rating.icon}
                                        <span>{rating.quality}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">檔案大小減少</p>
                                    <p className="text-2xl font-bold text-blue-600">{metrics.sizeReduction}%</p>
                                </div>
                            </div>
                        </div>

                        {/* 詳細指標 */}
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="bg-white border-2 border-purple-200 rounded-lg p-5">
                                <h4 className="text-sm font-semibold text-gray-600 mb-2">PSNR（峰值訊噪比）</h4>
                                <p className="text-3xl font-bold text-purple-600 mb-2">{metrics.psnr} dB</p>
                                <p className="text-xs text-gray-500">
                                    {parseFloat(metrics.psnr) >= 40
                                        ? "✓ 優秀（≥40 dB）"
                                        : parseFloat(metrics.psnr) >= 35
                                        ? "✓ 良好（≥35 dB）"
                                        : parseFloat(metrics.psnr) >= 30
                                        ? "△ 可接受（≥30 dB）"
                                        : "✗ 較差（<30 dB）"}
                                </p>
                            </div>

                            <div className="bg-white border-2 border-indigo-200 rounded-lg p-5">
                                <h4 className="text-sm font-semibold text-gray-600 mb-2">SSIM（結構相似性）</h4>
                                <p className="text-3xl font-bold text-indigo-600 mb-2">{metrics.ssim}</p>
                                <p className="text-xs text-gray-500">
                                    {parseFloat(metrics.ssim) >= 0.98
                                        ? "✓ 優秀（≥0.98）"
                                        : parseFloat(metrics.ssim) >= 0.95
                                        ? "✓ 良好（≥0.95）"
                                        : parseFloat(metrics.ssim) >= 0.9
                                        ? "△ 可接受（≥0.90）"
                                        : "✗ 較差（<0.90）"}
                                </p>
                            </div>

                            <div className="bg-white border-2 border-pink-200 rounded-lg p-5">
                                <h4 className="text-sm font-semibold text-gray-600 mb-2">MSE（均方誤差）</h4>
                                <p className="text-3xl font-bold text-pink-600 mb-2">{metrics.mse}</p>
                                <p className="text-xs text-gray-500">
                                    {parseFloat(metrics.mse) <= 50
                                        ? "✓ 優秀（≤50）"
                                        : parseFloat(metrics.mse) <= 100
                                        ? "✓ 良好（≤100）"
                                        : parseFloat(metrics.mse) <= 200
                                        ? "△ 可接受（≤200）"
                                        : "✗ 較差（>200）"}
                                </p>
                            </div>
                        </div>

                        {/* 檔案資訊 */}
                        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                            <h4 className="font-semibold text-gray-700 mb-3">📁 檔案資訊</h4>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">
                                        圖片尺寸：
                                        <span className="font-semibold text-gray-800">
                                            {metrics.width} × {metrics.height} px
                                        </span>
                                    </p>
                                    <p className="text-gray-600 mt-1">
                                        原始檔案：
                                        <span className="font-semibold text-gray-800">{metrics.originalSize} KB</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-600">
                                        壓縮後檔案：
                                        <span className="font-semibold text-gray-800">{metrics.compressedSize} KB</span>
                                    </p>
                                    <p className="text-gray-600 mt-1">
                                        節省空間：
                                        <span className="font-semibold text-green-600">
                                            {(metrics.originalSize - metrics.compressedSize).toFixed(2)} KB
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 使用建議 */}
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded">
                            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                <Info className="w-5 h-5" />
                                使用建議
                            </h4>
                            <div className="text-sm text-blue-800 space-y-1">
                                {parseFloat(metrics.psnr) >= 35 && parseFloat(metrics.ssim) >= 0.95 ? (
                                    <>
                                        <p>✓ 此壓縮品質非常適合手機、平板、電腦螢幕觀看</p>
                                        <p>✓ 肉眼幾乎無法察覺與原圖的差異</p>
                                        <p>✓ 可以放心用於社群媒體分享或個人收藏</p>
                                    </>
                                ) : parseFloat(metrics.psnr) >= 30 && parseFloat(metrics.ssim) >= 0.9 ? (
                                    <>
                                        <p>✓ 適合一般網路分享和螢幕觀看</p>
                                        <p>△ 放大檢視時可能會注意到細節損失</p>
                                        <p>△ 不建議用於需要高品質的場合</p>
                                    </>
                                ) : (
                                    <>
                                        <p>✗ 品質損失較明顯，可能影響觀賞體驗</p>
                                        <p>✗ 建議調整壓縮參數或使用較高品質設定</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 指標說明 */}
                <div className="mt-8 bg-gray-50 rounded-lg p-5 border border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-3">📚 指標說明</h4>
                    <div className="space-y-3 text-sm text-gray-600">
                        <div>
                            <strong className="text-gray-800">PSNR（峰值訊噪比）：</strong>
                            <p className="mt-1">
                                數值越高表示品質越好。通常 30-40 dB 為可接受範圍，40 dB 以上為優秀品質。
                            </p>
                        </div>
                        <div>
                            <strong className="text-gray-800">SSIM（結構相似性指數）：</strong>
                            <p className="mt-1">
                                範圍 0-1，越接近 1 表示越相似。0.95 以上一般認為品質良好，0.98 以上為優秀。
                            </p>
                        </div>
                        <div>
                            <strong className="text-gray-800">MSE（均方誤差）：</strong>
                            <p className="mt-1">數值越小表示誤差越小。MSE 越低代表壓縮品質越好。</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageQualityAnalyzer;
