/**
 * 模拟数据层。
 * 之后接后端时，只需要把这几个导出替换成 API 请求（字段名保持不变即可），
 * 页面对数据的假设都收敛在这一层：见 DESIGN.md「数据契约」。
 */

export type RunMode = 'web' | 'download';

export interface WebBuild {
  /** 入口文件，例如 index.html */
  entry: string;
  /** 构建产物大小，字节 */
  bytes: number;
  engineVersion: string;
  /** 运行域名（隔离域），正式环境由平台分配 */
  host: string;
}

export interface DownloadBuild {
  platform: 'Windows' | 'macOS' | 'Linux';
  arch: string;
  bytes: number;
  file: string;
  requirements: { label: string; value: string }[];
}

export interface Game {
  slug: string;
  title: string;
  titleCn: string;
  tagline: string;
  description: string[];
  studio: { name: string; handle: string };
  engine: string;
  engineVersion: string;
  categories: string[];
  tags: string[];
  runMode: RunMode;
  platforms: string[];
  version: string;
  updatedAt: string;
  releasedAt: string;
  plays: number;
  likes: number;
  price: 'free' | 'paid';
  cover: string;
  keyart?: string;
  shots?: string[];
  webBuild?: WebBuild;
  download?: DownloadBuild;
  changelog?: { version: string; date: string; notes: string[] }[];
  featured?: boolean;
}

export const games: Game[] = [
  {
    slug: 'neon-drift',
    title: 'Neon Drift',
    titleCn: '霓虹漂移',
    tagline: '雨夜、没有刹车、只有一条街和八秒钟。',
    description: [
      '《霓虹漂移》是一款纯粹到有点固执的街机竞速。没有车辆改装树，没有开放世界，只有 14 条雨夜街道、一套物理手感和一个要求你把每个弯都跑成直线的计时榜。',
      '抓地力被刻意调低，车身惯性保留到近乎失控。你要做的是在入弯前 0.3 秒松开油门，用一次下滑把车头压回出弯线——做对了，整条街会安静下来，只剩雨刷和引擎的回声。',
      '本作由两个人在 11 个月里完成，网页版本为完整游戏，无内购、无账号要求，进度保存在本地。',
    ],
    studio: { name: '夜行者工作室', handle: 'nightrunner' },
    engine: 'Unity',
    engineVersion: '2022.3.42f1',
    categories: ['竞速', '街机'],
    tags: ['雨夜', '低多边形', '排行榜', '单人'],
    runMode: 'web',
    platforms: ['Web'],
    version: '1.4.2',
    updatedAt: '2026-11-09',
    releasedAt: '2025-08-21',
    plays: 184320,
    likes: 12840,
    price: 'free',
    cover: '/art/covers/neon-drift.webp',
    keyart: '/art/keyart/neon-drift-keyart.webp',
    shots: ['/art/shots/neon-drift-01.webp', '/art/shots/neon-drift-02.webp', '/art/shots/neon-drift-03.webp'],
    webBuild: {
      entry: 'index.html',
      engineVersion: '2022.3.42f1',
      bytes: 62_914_560,
      host: 'neon-drift.jcgame.run',
    },
    changelog: [
      {
        version: '1.4.2',
        date: '2026-11-09',
        notes: ['修复暴雨场景在 120Hz 屏幕上物理步进抖动的问题', '为第 9 条赛道补充夜间雾效', '计时榜新增按地区筛选'],
      },
      {
        version: '1.3.0',
        date: '2026-08-30',
        notes: ['新增第 13、14 条赛道', '手柄支持（XInput / DualShock）', '降低首次加载资源体积约 18%'],
      },
    ],
    featured: true,
  },
  {
    slug: 'tundra-courier',
    title: 'Tundra Courier',
    titleCn: '冻原信使',
    tagline: '极夜里，把一封信送到地图上不存在的地方。',
    description: [
      '你是一个在极圈内送信的人。没有战斗，没有经验值，只有体温、风力和一封必须在冬天结束前送达的信。',
      '游戏把"走路"做成了核心机制：雪深决定速度，风向决定体温流失，而每一步都会改变你回程的路线。全程约 6 小时，一次通关不会看到全部岔路。',
    ],
    studio: { name: '五号公路', handle: 'roadfive' },
    engine: 'Godot',
    engineVersion: '4.3',
    categories: ['探索', '叙事'],
    tags: ['雪原', '步行模拟', '无战斗', '水彩'],
    runMode: 'web',
    platforms: ['Web', 'Windows'],
    version: '0.9.7',
    updatedAt: '2026-11-02',
    releasedAt: '2026-03-14',
    plays: 41230,
    likes: 5210,
    price: 'free',
    cover: '/art/covers/tundra-courier.webp',
    webBuild: { entry: 'index.html', engineVersion: '4.3', bytes: 28_311_552, host: 'tundra.jcgame.run' },
    changelog: [
      { version: '0.9.7', date: '2026-11-02', notes: ['重做第四章的风向计算', '修复存档在浏览器刷新后丢失'] },
    ],
    featured: true,
  },
  {
    slug: 'ink-tide',
    title: 'Ink Tide',
    titleCn: '墨潮',
    tagline: '水墨画的留白里，藏着会动的东西。',
    description: [
      '《墨潮》把动作游戏放进一张宣纸里。画面只用墨、水和一点朱红，你的每一次挥击都会在纸上留下不可撤销的一笔——打完整场战斗，纸上会留下一幅属于你的画。',
      '战斗节奏偏向一击必杀：敌人和你都只有一次机会。这不是难度炫耀，而是为了让每一笔都有分量。',
    ],
    studio: { name: '墨见', handle: 'mojian' },
    engine: 'Unreal Engine',
    engineVersion: '5.4',
    categories: ['动作', '冒险'],
    tags: ['水墨', '一击必杀', '横版', '东方'],
    runMode: 'download',
    platforms: ['Windows'],
    version: '1.0.3',
    updatedAt: '2026-10-28',
    releasedAt: '2025-12-05',
    plays: 96840,
    likes: 8930,
    price: 'paid',
    cover: '/art/covers/ink-tide.webp',
    download: {
      platform: 'Windows',
      arch: 'x64',
      bytes: 3_221_225_472,
      file: 'InkTide-1.0.3-win64.zip',
      requirements: [
        { label: '系统', value: 'Windows 10 1909 或更新' },
        { label: '处理器', value: 'Intel i5-8400 / Ryzen 5 2600' },
        { label: '显卡', value: 'GTX 1060 6GB / RX 580' },
        { label: '内存', value: '8 GB' },
        { label: '存储', value: '4 GB 可用空间' },
      ],
    },
    changelog: [
      { version: '1.0.3', date: '2026-10-28', notes: ['修复第 12 章 Boss 战在低帧率下的判定错误', '新增手柄震动强度设置'] },
    ],
    featured: true,
  },
  {
    slug: 'pixel-ronin',
    title: 'Pixel Ronin',
    titleCn: '像素浪人',
    tagline: '每一次死亡，都会让桥上的枫叶落得更快。',
    description: [
      '一款 16 位风格的 Roguelike 动作游戏。你的角色只有一击的血量，但可以在死亡前"读"到敌人下一次出刀的方向。',
      '每局 15 分钟，共 9 座桥、40 种敌人组合。真正的进度不是数值，而是你记住的那些节奏。',
    ],
    studio: { name: '三叠工作室', handle: 'triplefold' },
    engine: 'HTML5',
    engineVersion: 'ES2022',
    categories: ['动作', 'Roguelike'],
    tags: ['像素', '一击必杀', '街机', '快节奏'],
    runMode: 'web',
    platforms: ['Web'],
    version: '2.1.0',
    updatedAt: '2026-11-11',
    releasedAt: '2025-06-02',
    plays: 312400,
    likes: 21870,
    price: 'free',
    cover: '/art/covers/pixel-ronin.webp',
    webBuild: { entry: 'index.html', engineVersion: 'ES2022', bytes: 8_808_448, host: 'ronin.jcgame.run' },
    changelog: [{ version: '2.1.0', date: '2026-11-11', notes: ['新增第 9 座桥', '支持键盘自定义键位'] }],
  },
  {
    slug: 'teeth-of-the-deep',
    title: 'Teeth of the Deep',
    titleCn: '深喉',
    tagline: '灯照到的地方，就是它想让你看到的地方。',
    description: [
      '深海作业潜艇失联 46 小时后，你是唯一下去的人。手电电量有限，氧气有限，而黑暗里的东西似乎很享受你把灯打开。',
      '恐怖来自资源而不是跳脸：你每照亮一次，就离黑暗更近一点。全程约 4 小时，支持手柄。',
    ],
    studio: { name: '静水', handle: 'stillwater' },
    engine: 'Unity',
    engineVersion: '2022.3.38f1',
    categories: ['恐怖', '探索'],
    tags: ['深海', '资源管理', '第一人称', '单人'],
    runMode: 'download',
    platforms: ['Windows'],
    version: '1.2.0',
    updatedAt: '2026-10-19',
    releasedAt: '2026-02-27',
    plays: 74820,
    likes: 7420,
    price: 'paid',
    cover: '/art/covers/teeth-of-the-deep.webp',
    download: {
      platform: 'Windows',
      arch: 'x64',
      bytes: 2_040_109_056,
      file: 'TeethOfTheDeep-1.2.0-win64.zip',
      requirements: [
        { label: '系统', value: 'Windows 10 64 位' },
        { label: '处理器', value: 'Intel i5-7400 / Ryzen 3 3200G' },
        { label: '显卡', value: 'GTX 970 / RX 570' },
        { label: '内存', value: '8 GB' },
        { label: '存储', value: '3 GB 可用空间' },
      ],
    },
    changelog: [{ version: '1.2.0', date: '2026-10-19', notes: ['新增"静默"难度', '修复第 3 区手电电量不刷新'] }],
  },
  {
    slug: 'last-train',
    title: 'Last Train',
    titleCn: '末班车',
    tagline: '凌晨三点，站台上还有一个人没上车。',
    description: [
      '一款只有对话的叙事游戏。你在末班地铁上遇到五个人，每个人都在回避同一件事。你能做的只有听完，以及在到站前决定要不要开口。',
      '没有分支树，没有选项提示。你说话的方式会改变他们下车时的状态，而你不会知道改了什么。',
    ],
    studio: { name: '冷光', handle: 'coldlight' },
    engine: 'Unity',
    engineVersion: '6000.0.32f1',
    categories: ['叙事', '视觉小说'],
    tags: ['都市', '对话', '短篇', '中文'],
    runMode: 'download',
    platforms: ['Windows', 'macOS'],
    version: '1.0.1',
    updatedAt: '2026-09-30',
    releasedAt: '2026-05-16',
    plays: 52310,
    likes: 6180,
    price: 'free',
    cover: '/art/covers/last-train.webp',
    download: {
      platform: 'Windows',
      arch: 'x64',
      bytes: 812_646_400,
      file: 'LastTrain-1.0.1-win64.zip',
      requirements: [
        { label: '系统', value: 'Windows 10 64 位 / macOS 13' },
        { label: '处理器', value: '双核 2.4 GHz' },
        { label: '显卡', value: '集成显卡即可' },
        { label: '内存', value: '4 GB' },
        { label: '存储', value: '1 GB 可用空间' },
      ],
    },
  },
  {
    slug: 'iron-harvest',
    title: 'Iron Harvest 1919',
    titleCn: '铁收割',
    tagline: '用收割机改装成的战争机器，去守住最后一片麦田。',
    description: [
      '回合制战术策略。你指挥一支由农业机械改装而来的民兵部队，在 1919 年的东欧平原上守住村庄的收成。',
      '单位不是消耗品：每一台机器都有名字、服役记录和磨损，损失了就真的没有了。战役共 18 关。',
    ],
    studio: { name: '铁砧游戏', handle: 'anvil' },
    engine: 'Unreal Engine',
    engineVersion: '5.3',
    categories: ['策略', '回合制'],
    tags: ['柴油朋克', '战术', '战役', '长线'],
    runMode: 'download',
    platforms: ['Windows', 'Linux'],
    version: '1.6.0',
    updatedAt: '2026-11-14',
    releasedAt: '2024-11-08',
    plays: 128900,
    likes: 11240,
    price: 'paid',
    cover: '/art/covers/iron-harvest.webp',
    download: {
      platform: 'Windows',
      arch: 'x64',
      bytes: 7_516_192_768,
      file: 'IronHarvest-1.6.0-win64.zip',
      requirements: [
        { label: '系统', value: 'Windows 10 / 11 64 位' },
        { label: '处理器', value: 'Intel i5-9600K / Ryzen 5 3600' },
        { label: '显卡', value: 'RTX 2060 / RX 5700' },
        { label: '内存', value: '16 GB' },
        { label: '存储', value: '8 GB 可用空间' },
      ],
    },
  },
  {
    slug: 'acorn-house',
    title: 'Acorn House',
    titleCn: '橡果小屋',
    tagline: '把一颗橡果，慢慢改成一个家。',
    description: [
      '没有倒计时，没有体力值。你在森林里收集材料，把一颗空橡果改成能住人的房子。',
      '适合睡前玩 20 分钟。音乐由一个人在厨房里录制完成。',
    ],
    studio: { name: '软木塞', handle: 'cork' },
    engine: 'Godot',
    engineVersion: '4.2',
    categories: ['休闲', '模拟'],
    tags: ['治愈', '建造', '无压力', '低配可玩'],
    runMode: 'web',
    platforms: ['Web'],
    version: '1.1.4',
    updatedAt: '2026-10-05',
    releasedAt: '2025-10-12',
    plays: 224180,
    likes: 19320,
    price: 'free',
    cover: '/art/covers/acorn-house.webp',
    webBuild: { entry: 'index.html', engineVersion: '4.2', bytes: 18_874_368, host: 'acorn.jcgame.run' },
  },
  {
    slug: 'void-basket',
    title: 'Void Basket',
    titleCn: '零重力篮球',
    tagline: '在地面不存在的球场，规则只剩一条：球进框。',
    description: [
      '2v2 零重力篮球。没有走步，没有出界，你可以在空中待 6 秒。',
      '本地分屏 + 网页联机，一局 3 分钟。周末联机人数最多，建议约人一起。',
    ],
    studio: { name: '抛球', handle: 'tossup' },
    engine: 'Unity',
    engineVersion: '2022.3.44f1',
    categories: ['体育', '派对'],
    tags: ['多人', '本地分屏', '物理', '搞怪'],
    runMode: 'web',
    platforms: ['Web'],
    version: '3.0.1',
    updatedAt: '2026-11-07',
    releasedAt: '2025-04-01',
    plays: 402310,
    likes: 16720,
    price: 'free',
    cover: '/art/covers/void-basket.webp',
    webBuild: { entry: 'index.html', engineVersion: '2022.3.44f1', bytes: 41_360_384, host: 'voidbasket.jcgame.run' },
  },
  {
    slug: 'circuit-bloom',
    title: 'Circuit Bloom',
    titleCn: '电路花期',
    tagline: '每按对一个节拍，花就开一瓣。',
    description: [
      '一款不需要"手速"的音游。判定窗口宽，但连击越长音乐层叠得越复杂，你是在和时间一起编曲。',
      '内置 24 首曲目，支持导入自己的音频自动生成谱面（浏览器内完成，不上传）。',
    ],
    studio: { name: '相位', handle: 'phase' },
    engine: 'TypeScript',
    engineVersion: 'Web Audio API',
    categories: ['音乐', '休闲'],
    tags: ['音游', '可导入曲目', '极简', '浏览器运行'],
    runMode: 'web',
    platforms: ['Web'],
    version: '1.8.0',
    updatedAt: '2026-11-15',
    releasedAt: '2026-01-20',
    plays: 156740,
    likes: 14210,
    price: 'free',
    cover: '/art/covers/circuit-bloom.webp',
    webBuild: { entry: 'index.html', engineVersion: 'Web Audio API', bytes: 5_242_880, host: 'bloom.jcgame.run' },
  },
  {
    slug: 'half-light',
    title: 'Half-Light',
    titleCn: '半光',
    tagline: '灯灭了以后，路才会显出来。',
    description: [
      '横版平台跳跃，但光是资源：灯亮时能看清地形，也会吸引东西过来；灯灭时安全，但你只能靠记忆走路。',
      '共 26 个关卡，每个关卡只有一张存档点。',
    ],
    studio: { name: 'jc', handle: 'jc' },
    engine: 'Unity',
    engineVersion: '2021.3.45f1',
    categories: ['平台跳跃', '解谜'],
    tags: ['光影', '硬核', '像素', '单人'],
    runMode: 'download',
    platforms: ['Windows'],
    version: '1.3.2',
    updatedAt: '2026-08-22',
    releasedAt: '2025-09-09',
    plays: 61240,
    likes: 4980,
    price: 'free',
    cover: '/art/covers/half-light.webp',
    download: {
      platform: 'Windows',
      arch: 'x64',
      bytes: 356_515_840,
      file: 'HalfLight-1.3.2-win64.zip',
      requirements: [
        { label: '系统', value: 'Windows 7 SP1 或更新' },
        { label: '处理器', value: '双核 2.0 GHz' },
        { label: '显卡', value: '支持 DirectX 11' },
        { label: '内存', value: '4 GB' },
        { label: '存储', value: '500 MB 可用空间' },
      ],
    },
  },
  {
    slug: 'paper-kite',
    title: 'Paper Kite',
    titleCn: '纸鸢',
    tagline: '把一根线，放到云的那一边。',
    description: [
      '手工纸片风格的物理解谜。你只能改变风向和线的长度，让纸鸢飞过 40 个山丘。',
      '所有画面都是纸、剪刀和胶水做出来的，然后逐帧拍摄。',
    ],
    studio: { name: '剪纸铺', handle: 'papercut' },
    engine: 'Cocos Creator',
    engineVersion: '3.8.3',
    categories: ['解谜', '休闲'],
    tags: ['纸艺', '物理', '手作', '亲子'],
    runMode: 'web',
    platforms: ['Web'],
    version: '1.0.8',
    updatedAt: '2026-07-18',
    releasedAt: '2026-04-11',
    plays: 88910,
    likes: 8340,
    price: 'free',
    cover: '/art/covers/paper-kite.webp',
    webBuild: { entry: 'index.html', engineVersion: '3.8.3', bytes: 12_582_912, host: 'paperkite.jcgame.run' },
  },
];

export interface Creator {
  handle: string;
  name: string;
  bio: string;
  followers: number;
  since: string;
  location: string;
  links: { label: string; url: string }[];
  accent: string;
}

export const creators: Creator[] = [
  {
    handle: 'nightrunner',
    name: '夜行者工作室',
    bio: '两个人，一台旧工作站，只做雨夜里的车。',
    followers: 8412,
    since: '2025-03',
    location: '中国 重庆',
    links: [
      { label: 'Bilibili', url: '#' },
      { label: 'GitHub', url: '#' },
    ],
    accent: '#ff7a45',
  },
  {
    handle: 'roadfive',
    name: '五号公路',
    bio: '做走路游戏。前地图测绘员，喜欢把真实地形塞进游戏里。',
    followers: 3920,
    since: '2024-11',
    location: '中国 哈尔滨',
    links: [{ label: '个人站', url: '#' }],
    accent: '#6ea8c9',
  },
  {
    handle: 'mojian',
    name: '墨见',
    bio: '三个人，一支笔，一个关于留白的执念。',
    followers: 15230,
    since: '2023-06',
    location: '中国 杭州',
    links: [
      { label: 'Bilibili', url: '#' },
      { label: 'X', url: '#' },
    ],
    accent: '#c8553d',
  },
  {
    handle: 'triplefold',
    name: '三叠工作室',
    bio: '只做能在浏览器里 3 秒打开的游戏。',
    followers: 6180,
    since: '2024-02',
    location: '中国 成都',
    links: [{ label: 'GitHub', url: '#' }],
    accent: '#8a9b4e',
  },
  {
    handle: 'stillwater',
    name: '静水',
    bio: '一个人。白天写后端，晚上做让人不敢关灯的东西。',
    followers: 2740,
    since: '2025-01',
    location: '中国 深圳',
    links: [{ label: '个人站', url: '#' }],
    accent: '#4e8f96',
  },
  {
    handle: 'jc',
    name: 'jc',
    bio: '关卡设计师，业余做游戏，偏爱光与影。',
    followers: 1980,
    since: '2024-08',
    location: '中国 深圳',
    links: [{ label: 'Bilibili', url: '#' }],
    accent: '#8f7bb0',
  },
];

export const categories = [
  { slug: 'action', name: '动作', desc: '手感与节奏', count: 214, color: '#FF7A5C', preview: '/art/covers/pixel-ronin.webp' },
  { slug: 'puzzle', name: '解谜', desc: '想通的那一刻', count: 168, color: '#E8B04B', preview: '/art/covers/paper-kite.webp' },
  { slug: 'story', name: '叙事', desc: '听完一个故事', count: 132, color: '#E39BB0', preview: '/art/covers/last-train.webp' },
  { slug: 'racing', name: '竞速', desc: '把弯跑直', count: 47, color: '#4CC9F0', preview: '/art/covers/neon-drift.webp' },
  { slug: 'horror', name: '恐怖', desc: '别开灯', count: 63, color: '#C0494E', preview: '/art/covers/teeth-of-the-deep.webp' },
  { slug: 'strategy', name: '策略', desc: '一步想三步', count: 58, color: '#7FA650', preview: '/art/covers/iron-harvest.webp' },
  { slug: 'sim', name: '模拟', desc: '慢一点也没关系', count: 121, color: '#46C08A', preview: '/art/covers/acorn-house.webp' },
  { slug: 'party', name: '派对', desc: '人越多越好玩', count: 39, color: '#F472B6', preview: '/art/covers/void-basket.webp' },
  { slug: 'music', name: '音乐', desc: '跟着节拍走', count: 44, color: '#6C8CFF', preview: '/art/covers/circuit-bloom.webp' },
];

/** 引擎不是枚举：上传页从这里取候选，但允许填任意值（"其它"），后端存字符串。 */
export const engines = [
  { name: 'Unity', count: 412 },
  { name: 'Unreal Engine', count: 96 },
  { name: 'Godot', count: 187 },
  { name: 'Cocos Creator', count: 54 },
  { name: 'HTML5', count: 231 },
  { name: 'TypeScript', count: 88 },
  { name: 'GameMaker', count: 41 },
];

export const runModes: { value: RunMode; label: string; desc: string }[] = [
  { value: 'web', label: '网页试玩', desc: '玩家点开就跑，不用下载。适合 WebGL、HTML5、Web Export 构建。' },
  { value: 'download', label: '客户端下载', desc: '提供 Windows / macOS / Linux 安装包，适合桌面构建。' },
];

/** 每个引擎在上传时该传什么：这张表是"不统一构建格式"的落点。 */
export const engineBuildGuide: Record<
  string,
  { web?: string; download?: string }
> = {
  Unity: { web: 'WebGL 构建（Build 目录 + index.html）', download: 'Windows x64 构建（.zip）' },
  'Unreal Engine': { web: '暂不支持网页试玩', download: 'Windows x64 打包（.zip，需含 Engine/Content）' },
  Godot: { web: 'Web 导出（index.html + .wasm + .pck）', download: 'Windows 导出（.zip）' },
  'Cocos Creator': { web: 'Web Mobile / Web Desktop 构建（index.html + assets）', download: '原生构建需自行打包' },
  HTML5: { web: '任意静态站点（index.html 入口）', download: '需打包为可执行文件' },
  TypeScript: { web: '打包后的静态产物（index.html 入口）', download: '需打包为可执行文件' },
};

export function getGame(slug: string) {
  return games.find((g) => g.slug === slug);
}

export function getCreator(handle: string) {
  return creators.find((c) => c.handle === handle);
}

export function gamesByCreator(handle: string) {
  return games.filter((g) => g.studio.handle === handle);
}

export function categoryCount(name: string) {
  return games.filter((g) => g.categories.includes(name)).length;
}

export function formatBytes(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function formatCount(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1)} 万`;
  return n.toLocaleString('zh-CN');
}

/** 当前登录用户（演示用），正式环境由会话接口返回 */
export const currentUser = {
  handle: 'jc',
  name: 'jc',
  email: 'jc@example.com',
  bio: '独立开发者，做物理和光影相关的小游戏。',
  joined: '2026-02-11',
};
