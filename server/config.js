/**
 * 奖品设置
 * type: 唯一标识，0是默认特别奖的占位符，其它奖品不可使用
 * count: 奖品数量
 * title: 奖品描述
 * text: 奖品标题
 * img: 图片地址
 */
const prizes = [
  {
    type: 0,
    count: 1000,
    title: "",
    text: "特别奖"
  },
  {
    type: 1,
    count: 1,
    text: "特等奖",
    title: "安哥拉红色的RioRoller",
    img: "../img/rioroller.jpg"
  },
  {
    type: 2,
    count: 1,
    text: "一等奖",
    title: "REKD天下无敌鞋垫",
    img: "../img/rekd.jpg"
  },
  {
    type: 3,
    count: 2,
    text: "二等奖",
    title: "纹身师、设计师、风水师联名风水扇",
    img: "../img/shanzi.jpg"
  }
];

/**
 * 一次抽取的奖品个数与prizes对应
 */
const EACH_COUNT = [1, 1, 2, 6, 7, 8, 9, 10];

/**
 * 卡片公司名称标识
 */
const COMPANY = "HOBO 2025";

module.exports = {
  prizes,
  EACH_COUNT,
  COMPANY
};
