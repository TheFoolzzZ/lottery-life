// Vercel Serverless Function - 获取临时数据
const config = require('../server/config.js');

// 内存存储（Vercel Serverless 函数是无状态的，实际生产需要使用数据库）
let configData = {
    users: [],
    prizes: config.prizes,
    EACH_COUNT: config.EACH_COUNT,
    COMPANY: config.COMPANY
};

let luckyData = {};

module.exports = async (req, res) => {
    // 设置 CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 获取本地存储的用户数据或使用配置
    const users = configData.users.length > 0 ? configData.users : [];

    res.status(200).json({
        cfgData: {
            prizes: configData.prizes,
            EACH_COUNT: configData.EACH_COUNT,
            COMPANY: configData.COMPANY
        },
        leftUsers: users,
        luckyData: luckyData
    });
};
