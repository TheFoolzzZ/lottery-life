// Vercel Serverless Function - 获取/保存配置
// 注意：Vercel Serverless 是无状态的，数据会在函数重启后丢失
// 生产环境建议使用 Vercel KV 或外部数据库

// 使用全局变量在同一实例的多次调用间保持状态
let savedConfig = {
    users: [],
    prizes: [],
    EACH_COUNT: [1],
    musicFileName: ""
};

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const url = req.url;

    // 保存配置
    if (url.includes('saveConfig')) {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const data = req.body;

        if (data.users) {
            savedConfig.users = data.users;
        }
        if (data.prizes) {
            savedConfig.prizes = data.prizes;
        }
        if (data.EACH_COUNT) {
            savedConfig.EACH_COUNT = data.EACH_COUNT;
        }
        if (data.musicFileName) {
            savedConfig.musicFileName = data.musicFileName;
        }

        console.log(`保存配置: ${savedConfig.users.length}名参与者, ${savedConfig.prizes.length}个奖项`);

        return res.status(200).json({ type: "success" });
    }

    // 获取配置
    if (url.includes('getConfig')) {
        const participants = savedConfig.users.map((user, index) => ({
            id: index + 1,
            name: user[1] || "",
            note: user[2] || "-"
        }));

        const prizes = savedConfig.prizes
            .filter(p => p.type !== 0)
            .map((p, index) => ({
                id: index + 1,
                type: p.type,
                text: p.text,
                count: p.count,
                title: p.title,
                img: p.img
            }));

        return res.status(200).json({
            participants: participants,
            prizes: prizes,
            musicFileName: savedConfig.musicFileName
        });
    }

    res.status(404).json({ error: 'Not found' });
};
