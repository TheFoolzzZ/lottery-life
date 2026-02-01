// Vercel Serverless Function - 保存抽奖结果
let luckyData = {};

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const data = req.body;

    if (data && data.type !== undefined && data.data) {
        luckyData[data.type] = luckyData[data.type] || [];
        luckyData[data.type] = luckyData[data.type].concat(data.data);

        console.log(`保存中奖数据: type=${data.type}, count=${data.data.length}`);

        return res.status(200).json({ type: "success" });
    }

    res.status(400).json({ error: 'Invalid data' });
};
