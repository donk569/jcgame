import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  CheckCircle,
  CloudArrowUp,
  FileArchive,
  Info,
  Plus,
  Trash,
  VideoCamera,
} from '@phosphor-icons/react';
import { useToast } from '@/components/Toast';
import { getCategories, getEngines, getEngineBuildGuide, getCurrentUser } from '@/api';
import { formatBytes } from '@/lib/format';

type Picked = { name: string; size: number; url?: string };

const engineOptions = [...getEngines().map((e) => e.name), 'GameMaker', 'RPG Maker', '其它引擎'];
const steps = ['基本信息', '媒体', '运行与技术', '检查并发布'];

const initial = {
  title: '',
  titleEn: '',
  tagline: '',
  developer: getCurrentUser().name,
  cats: [] as string[],
  tags: [] as string[],
  cover: null as Picked | null,
  shots: [] as Picked[],
  video: '',
  runMode: 'web' as 'web' | 'download',
  engine: '',
  engineOther: '',
  entry: 'index.html',
  build: null as Picked | null,
  platforms: ['Windows'] as string[],
  version: '0.1.0',
  changelog: '',
};

export default function Upload() {
  const toast = useToast();
  const categories = getCategories();
  const engineBuildGuide = getEngineBuildGuide();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');
  const [published, setPublished] = useState(false);
  const [dir, setDir] = useState(1);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const effectiveEngine = form.engine === '其它引擎' ? form.engineOther.trim() : form.engine;
  const guide = engineBuildGuide[form.engine];

  const validate = (target: number) => {
    const e: Record<string, string> = {};
    if (target >= 1) {
      if (!form.title.trim()) e.title = '给游戏取个名字';
      if (!form.tagline.trim()) e.tagline = '用一句话说清它是什么';
      else if (form.tagline.length > 90) e.tagline = '简介控制在 90 字以内';
      if (form.cats.length === 0) e.cats = '至少选一个分类';
    }
    if (target >= 2 && !form.cover) e.cover = '封面是玩家第一眼看到的东西，必须上传';
    if (target >= 3) {
      if (!effectiveEngine) e.engine = '选择或填写你用的引擎';
      if (!form.build) e.build = form.runMode === 'web' ? '请上传构建产物压缩包' : '请上传安装包';
      if (!form.version.trim()) e.version = '填一个版本号，例如 1.0.0';
      if (form.runMode === 'web' && !form.entry.trim()) e.entry = '网页版需要指定入口文件';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const go = (target: number) => {
    if (target > step && !validate(step + 1)) return;
    setDir(target > step ? 1 : -1);
    setStep(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addTag = () => {
    const v = tagInput.trim().replace(/[，,]/g, '');
    if (!v || form.tags.includes(v) || form.tags.length >= 8) return;
    set('tags', [...form.tags, v]);
    setTagInput('');
  };

  const checklist = useMemo(
    () => [
      { label: '游戏名称与简介', done: Boolean(form.title && form.tagline) },
      { label: '分类', done: form.cats.length > 0 },
      { label: '封面', done: Boolean(form.cover) },
      { label: '至少一张截图', done: form.shots.length > 0 },
      { label: '引擎信息', done: Boolean(effectiveEngine) },
      { label: '构建产物', done: Boolean(form.build) },
      { label: '版本与更新说明', done: Boolean(form.version && form.changelog.trim()) },
    ],
    [form, effectiveEngine],
  );
  const doneCount = checklist.filter((c) => c.done).length;

  if (published) {
    return (
      <div className="wrap flex min-h-[64vh] flex-col items-center justify-center py-16 text-center">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 340, damping: 18 }}
          className="grid h-16 w-16 place-items-center rounded-full bg-teal/14 text-teal"
        >
          <CheckCircle size={34} weight="duotone" />
        </motion.span>
        <h1 className="mt-6 text-[26px] font-bold tracking-[-0.03em]">已经提交发布</h1>
        <p className="mt-2 max-w-[42ch] text-[13.5px] leading-relaxed text-muted">
          《{form.title}》已进入队列。网页版会在构建校验通过后自动分配运行域名，通常几分钟内就能玩到。
        </p>
        <div className="mt-7 flex gap-2">
          <Link to="/me" className="btn btn-primary btn-sm">
            回到工作台
          </Link>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setPublished(false);
              setForm(initial);
              setStep(0);
            }}
          >
            再发一个
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap py-6 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(1.9rem,3.2vw,2.6rem)] font-extrabold tracking-[-0.035em]">
            发布游戏
          </h1>
          <p className="mt-2 max-w-[54ch] text-[13.5px] leading-relaxed text-muted">
            不限制引擎，也不要求统一构建格式。你只需要说清这是什么游戏、用什么跑起来。
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_300px]">
        <div>
          {/* 步骤 */}
          <div className="relative mb-4 inline-flex flex-wrap gap-1 rounded-none border border-line-soft bg-ink-800 p-1">
            {steps.map((s, i) => {
              const active = i === step;
              const done = i < step;
              return (
                <button
                  key={s}
                  onClick={() => go(i)}
                  className={`relative flex items-center gap-2 rounded-[2px] px-3 py-2 text-[12.5px] transition-colors ${
                    active ? 'text-bone' : done ? 'text-bone-dim' : 'text-muted-dim'
                  }`}
                  aria-current={active ? 'step' : undefined}
                >
                  {active && (
                    <motion.span
                      layoutId="step-pill"
                      className="absolute inset-0 rounded-[2px] bg-ink-600"
                      transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                    />
                  )}
                  <span className="relative z-[1] flex items-center gap-2">
                    <span className={`mono ${active ? 'text-brand' : ''}`}>
                      {done ? '✓' : `0${i + 1}`}
                    </span>
                    {s}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 表单容器 */}
          <div className="relative overflow-hidden rounded-none border border-line-soft bg-ink-800 p-5 md:p-7">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                initial={{ opacity: 0, x: dir * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -18 }}
                transition={{ duration: 0.26, ease: [0.22, 0.68, 0, 1] }}
              >
                {step === 0 && (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="游戏名称" required error={errors.title} htmlFor="title">
                        <input
                          id="title"
                          className="input"
                          value={form.title}
                          onChange={(e) => set('title', e.target.value)}
                          placeholder="例如：霓虹漂移"
                          aria-invalid={Boolean(errors.title)}
                        />
                      </Field>
                      <Field label="英文名" hint="可留空，展示在标题下方" htmlFor="titleEn">
                        <input
                          id="titleEn"
                          className="input"
                          value={form.titleEn}
                          onChange={(e) => set('titleEn', e.target.value)}
                          placeholder="Neon Drift"
                        />
                      </Field>
                    </div>

                    <Field
                      label="一句话简介"
                      required
                      error={errors.tagline}
                      hint={`像对朋友介绍那样写。${form.tagline.length}/90`}
                      htmlFor="tagline"
                    >
                      <textarea
                        id="tagline"
                        className="textarea min-h-[80px]"
                        value={form.tagline}
                        maxLength={90}
                        onChange={(e) => set('tagline', e.target.value)}
                        placeholder="雨夜、没有刹车、只有一条街和八秒钟。"
                        aria-invalid={Boolean(errors.tagline)}
                      />
                    </Field>

                    <Field label="分类" required error={errors.cats} hint="最多选 3 个">
                      <div className="flex flex-wrap gap-1.5">
                        {categories.map((c) => (
                          <button
                            key={c.slug}
                            className="chip"
                            data-active={form.cats.includes(c.name)}
                            onClick={() => {
                              if (form.cats.includes(c.name))
                                set('cats', form.cats.filter((x) => x !== c.name));
                              else if (form.cats.length < 3) set('cats', [...form.cats, c.name]);
                            }}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </Field>

                    <Field label="标签" hint="回车添加，最多 8 个。标签决定玩家怎么搜到它。">
                      <div className="flex flex-wrap items-center gap-1.5 rounded-[2px] border border-line bg-ink-950 p-2">
                        {form.tags.map((t) => (
                          <span key={t} className="chip chip-brand">
                            {t}
                            <button
                              onClick={() => set('tags', form.tags.filter((x) => x !== t))}
                              aria-label={`移除标签 ${t}`}
                            >
                              <Trash size={11} />
                            </button>
                          </span>
                        ))}
                        <input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                          onBlur={addTag}
                          className="h-8 min-w-[120px] flex-1 bg-transparent px-1 text-[13px] outline-none placeholder:text-muted-dim"
                          placeholder="输入标签，回车添加"
                          aria-label="添加标签"
                        />
                      </div>
                    </Field>

                    <Field label="开发者名称" hint="会显示在游戏详情页，团队名或工作室名都行" htmlFor="dev">
                      <input
                        id="dev"
                        className="input"
                        value={form.developer}
                        onChange={(e) => set('developer', e.target.value)}
                      />
                    </Field>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-6">
                    <Field
                      label="封面"
                      required
                      error={errors.cover}
                      hint="竖版 3:4，建议 1200×1600。这是玩家第一眼看到的东西。"
                    >
                      <DropZone
                        accept="image/*"
                        label="拖入封面，或点击选择"
                        icon={<CloudArrowUp size={22} weight="duotone" />}
                        value={form.cover}
                        onChange={(f) => set('cover', f)}
                        onClear={() => set('cover', null)}
                        preview
                      />
                    </Field>

                    <Field label="游戏截图" hint={`最多 5 张，16:10 横向。已上传 ${form.shots.length}/5`}>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                        <AnimatePresence initial={false}>
                          {form.shots.map((s, i) => (
                            <motion.div
                              key={s.name + i}
                              layout
                              initial={{ opacity: 0, scale: 0.94 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.94 }}
                              className="group relative overflow-hidden rounded-[2px] border border-line"
                            >
                              <img src={s.url} alt="" className="aspect-[16/10] w-full object-cover" />
                              <button
                                onClick={() => set('shots', form.shots.filter((_, idx) => idx !== i))}
                                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-[2px] bg-ink-950/85 text-bone opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                                aria-label="移除截图"
                              >
                                <Trash size={11} />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {form.shots.length < 5 && (
                          <label className="flex aspect-[16/10] cursor-pointer flex-col items-center justify-center gap-1 rounded-[2px] border border-dashed border-line text-muted-dim transition-colors hover:border-brand hover:text-brand">
                            <Plus size={16} weight="bold" />
                            <span className="text-[11px]">添加</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="sr-only"
                              onChange={(e) => {
                                const files = Array.from(e.target.files ?? []);
                                const picked = files.slice(0, 5 - form.shots.length).map((f) => ({
                                  name: f.name,
                                  size: f.size,
                                  url: URL.createObjectURL(f),
                                }));
                                set('shots', [...form.shots, ...picked]);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </Field>

                    <Field
                      label="预告片链接"
                      hint="Bilibili / YouTube 都行，选填。详情页会单独开一个视频区域。"
                      htmlFor="video"
                    >
                      <div className="flex items-center gap-2">
                        <VideoCamera size={16} className="shrink-0 text-muted" />
                        <input
                          id="video"
                          className="input"
                          value={form.video}
                          onChange={(e) => set('video', e.target.value)}
                          placeholder="https://www.bilibili.com/video/..."
                        />
                      </div>
                    </Field>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <Field label="运行方式" required hint="两种方式可以后期再加，先选主要的那个">
                      <div className="grid gap-2 sm:grid-cols-2">
                        {(
                          [
                            ['web', '网页试玩', '玩家点开就跑，适合 WebGL / HTML5 / Web Export 构建'],
                            ['download', '客户端下载', '提供桌面安装包，玩家下载后运行'],
                          ] as const
                        ).map(([value, label, desc]) => (
                          <button
                            key={value}
                            onClick={() => set('runMode', value)}
                            className={`relative overflow-hidden rounded-none border p-4 text-left transition-all ${
                              form.runMode === value
                                ? 'border-brand/60 bg-brand/8'
                                : 'border-line hover:border-line-bright'
                            }`}
                            aria-pressed={form.runMode === value}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[13.5px] font-semibold">{label}</span>
                              <span
                                className={`grid h-[18px] w-[18px] place-items-center rounded-full border ${
                                  form.runMode === value
                                    ? 'border-brand bg-brand text-brand-ink'
                                    : 'border-line'
                                }`}
                              >
                                {form.runMode === value && <Check size={11} weight="bold" />}
                              </span>
                            </div>
                            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{desc}</p>
                          </button>
                        ))}
                      </div>
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="游戏引擎" required error={errors.engine}>
                        <select
                          className="select"
                          value={form.engine}
                          onChange={(e) => set('engine', e.target.value)}
                          aria-invalid={Boolean(errors.engine)}
                        >
                          <option value="">选择引擎</option>
                          {engineOptions.map((e) => (
                            <option key={e} value={e}>
                              {e}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="版本号" required error={errors.version}>
                        <input
                          className="input mono"
                          value={form.version}
                          onChange={(e) => set('version', e.target.value)}
                          placeholder="1.0.0"
                          aria-invalid={Boolean(errors.version)}
                        />
                      </Field>
                    </div>

                    {form.engine === '其它引擎' && (
                      <Field label="引擎名称" hint="随便填，平台不会限制">
                        <input
                          className="input"
                          value={form.engineOther}
                          onChange={(e) => set('engineOther', e.target.value)}
                          placeholder="例如：自研引擎、Love2D、Bevy"
                        />
                      </Field>
                    )}

                    {guide && (
                      <div className="flex gap-2.5 rounded-none border border-line-soft bg-ink-900/60 px-3.5 py-3 text-[12.5px] leading-relaxed text-muted">
                        <Info size={14} className="mt-0.5 shrink-0 text-brand" />
                        <span>
                          按你选的引擎，{form.runMode === 'web' ? '网页版' : '桌面版'}需要上传：
                          <span className="text-bone">
                            {(form.runMode === 'web' ? guide.web : guide.download) ?? '对应构建产物'}
                          </span>
                        </span>
                      </div>
                    )}

                    {form.runMode === 'web' ? (
                      <>
                        <Field
                          label="构建产物"
                          required
                          error={errors.build}
                          hint="打包成 .zip 上传，保留目录结构。解压后要能直接通过入口文件打开。"
                        >
                          <DropZone
                            accept=".zip,.7z,.tar,.gz"
                            label="拖入 zip，或点击选择"
                            icon={<FileArchive size={22} weight="duotone" />}
                            value={form.build}
                            onChange={(f) => set('build', f)}
                            onClear={() => set('build', null)}
                          />
                        </Field>
                        <Field
                          label="入口文件"
                          required
                          error={errors.entry}
                          hint="相对压缩包根目录的路径，多数引擎是 index.html"
                        >
                          <input
                            className="input mono"
                            value={form.entry}
                            onChange={(e) => set('entry', e.target.value)}
                            aria-invalid={Boolean(errors.entry)}
                          />
                        </Field>
                        <div className="rounded-none border border-teal/25 bg-teal/6 px-3.5 py-3 text-[12.5px] leading-relaxed text-bone-dim/85">
                          网页版会分配独立域（例如{' '}
                          <span className="mono text-teal">your-game.jcgame.run</span>
                          ），在沙箱 iframe 里运行。游戏拿不到主站登录态、Cookie 和本地存储。
                        </div>
                      </>
                    ) : (
                      <>
                        <Field label="支持平台" required>
                          <div className="flex flex-wrap gap-1.5">
                            {['Windows', 'macOS', 'Linux'].map((p) => (
                              <button
                                key={p}
                                className="chip"
                                data-active={form.platforms.includes(p)}
                                onClick={() =>
                                  set(
                                    'platforms',
                                    form.platforms.includes(p)
                                      ? form.platforms.filter((x) => x !== p)
                                      : [...form.platforms, p],
                                  )
                                }
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </Field>
                        <Field
                          label="安装包"
                          required
                          error={errors.build}
                          hint="每个平台一个包。当前演示只接收一个，正式环境按平台分别上传。"
                        >
                          <DropZone
                            accept=".zip,.7z,.exe,.dmg,.tar.gz"
                            label="拖入安装包，或点击选择"
                            icon={<FileArchive size={22} weight="duotone" />}
                            value={form.build}
                            onChange={(f) => set('build', f)}
                            onClear={() => set('build', null)}
                          />
                        </Field>
                      </>
                    )}

                    <Field label="更新说明" hint="这次改了什么，一行一条">
                      <textarea
                        className="textarea"
                        value={form.changelog}
                        onChange={(e) => set('changelog', e.target.value)}
                        placeholder={'新增第 13 条赛道\n修复手柄断连后无法重连'}
                      />
                    </Field>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 rounded-none border border-line-soft bg-ink-900/50 p-4">
                      <div className="w-[92px] shrink-0 overflow-hidden rounded-none border border-line">
                        {form.cover ? (
                          <img src={form.cover.url} alt="封面预览" className="aspect-[3/4] w-full object-cover" />
                        ) : (
                          <div className="grid aspect-[3/4] place-items-center bg-ink-700 text-[11px] text-muted-dim">
                            无封面
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[17px] font-semibold">{form.title || '未命名游戏'}</div>
                        <div className="mono mt-1 text-muted-dim">
                          {form.titleEn || '—'} / {effectiveEngine || '未选引擎'}
                        </div>
                        <p className="mt-2 text-[13px] leading-relaxed text-muted">
                          {form.tagline || '还没有写简介'}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {form.cats.map((c) => (
                            <span key={c} className="chip">
                              {c}
                            </span>
                          ))}
                          <span className={`chip ${form.runMode === 'web' ? 'chip-teal' : 'chip-brand'}`}>
                            {form.runMode === 'web' ? '网页试玩' : '客户端下载'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <dl className="grid gap-x-8 gap-y-3 rounded-none border border-line-soft p-4 sm:grid-cols-2">
                      {[
                        ['开发者', form.developer || '—'],
                        ['版本', form.version || '—'],
                        ['构建产物', form.build ? `${form.build.name}（${formatBytes(form.build.size)}）` : '未上传'],
                        ['入口文件', form.runMode === 'web' ? form.entry || '—' : '不适用'],
                        ['支持平台', form.runMode === 'web' ? 'Web' : form.platforms.join(' / ') || '—'],
                        ['截图', `${form.shots.length} 张`],
                      ].map(([k, v]) => (
                        <div key={k} className="flex items-baseline justify-between gap-4">
                          <dt className="text-[12.5px] text-muted">{k}</dt>
                          <dd className="truncate text-right text-[12.5px] text-bone-dim">{v}</dd>
                        </div>
                      ))}
                    </dl>

                    <div className="rounded-none border border-line-soft p-4">
                      <div className="text-[13px] font-semibold">发布前检查</div>
                      <ul className="mt-3 space-y-2">
                        {checklist.map((c) => (
                          <li key={c.label} className="flex items-center gap-2.5 text-[13px]">
                            <span
                              className={`grid h-[16px] w-[16px] shrink-0 place-items-center rounded-full border ${
                                c.done ? 'border-teal/50 bg-teal/15 text-teal' : 'border-line text-transparent'
                              }`}
                            >
                              <Check size={9} weight="bold" />
                            </span>
                            <span className={c.done ? 'text-bone-dim' : 'text-muted-dim'}>{c.label}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-[12px] leading-relaxed text-muted-dim">
                        没有全部打勾也可以发布，缺失的项会在详情页显示为"开发者未填写"。
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              className="btn btn-quiet btn-sm"
              onClick={() => toast.push('草稿已保存，随时可以在工作台继续', 'ok')}
            >
              保存草稿
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={() => go(step - 1)}>
                  上一步
                </button>
              )}
              {step < 3 ? (
                <button className="btn btn-primary btn-sm" onClick={() => go(step + 1)}>
                  下一步
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  disabled={doneCount < 4}
                  onClick={() => {
                    if (!validate(3)) return;
                    setPublished(true);
                    window.scrollTo({ top: 0 });
                  }}
                >
                  发布游戏
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 右栏 */}
        <aside>
          <div className="sticky top-[92px] space-y-3">
            <div className="rounded-none border border-line-soft bg-ink-800 p-4">
              <div className="mono mb-3 text-muted-dim">发布后长这样</div>
              <div className="flex items-center gap-3">
                <div className="w-[64px] shrink-0 overflow-hidden rounded-[2px] border border-line">
                  {form.cover ? (
                    <img src={form.cover.url} alt="" className="aspect-[3/4] w-full object-cover" />
                  ) : (
                    <div className="grid aspect-[3/4] place-items-center bg-ink-900 text-[9px] text-muted-dim">
                      无封面
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold">
                    {form.title || '游戏名称'}
                  </div>
                  <div className="mono mt-1 truncate text-muted-dim">
                    {effectiveEngine || '引擎'} /{' '}
                    {form.runMode === 'web' ? '网页试玩' : '客户端下载'}
                  </div>
                  <div className="mono mt-0.5 truncate text-muted-dim">
                    {form.cats[0] ?? '未选分类'} · v{form.version}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-none border border-line-soft bg-ink-800 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-semibold">完成度</span>
                <span className="mono text-brand">
                  {doneCount}/{checklist.length}
                </span>
              </div>
              <div className="mt-2.5 flex gap-1">
                {checklist.map((c, i) => (
                  <motion.span
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${c.done ? 'bg-brand' : 'bg-white/10'}`}
                    initial={false}
                    animate={{ opacity: c.done ? 1 : 0.55 }}
                    transition={{ duration: 0.25 }}
                  />
                ))}
              </div>
              <ul className="mt-3 space-y-1.5">
                {checklist.map((c) => (
                  <li
                    key={c.label}
                    className={`flex items-center gap-2 text-[12px] ${
                      c.done ? 'text-bone-dim' : 'text-muted-dim'
                    }`}
                  >
                    <span
                      className={`h-1 w-1 rounded-full ${c.done ? 'bg-teal' : 'bg-line-bright'}`}
                      aria-hidden="true"
                    />
                    {c.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-none border border-line-soft p-4">
              <div className="text-[12.5px] font-semibold">不限制构建格式</div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
                Unity 传 WebGL 或 exe，Godot 传 .pck，H5 传静态站点 —— 平台统一的是发布信息，不是产物格式。
              </p>
              <div className="mono mt-3 space-y-1 text-muted-dim">
                <div>WebGL · WASM · HTML5</div>
                <div>Win64 · macOS · Linux</div>
              </div>
            </div>

            <p className="px-1 text-[11px] leading-relaxed text-muted-dim">
              演示环境：文件不会被真正上传，尺寸与进度均为模拟。
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-1 text-brand">*</span>}
      </label>
      {children}
      {error ? (
        <p className="field-error">{error}</p>
      ) : (
        hint && <p className="field-hint">{hint}</p>
      )}
    </div>
  );
}

function DropZone({
  label,
  icon,
  accept,
  value,
  onChange,
  onClear,
  preview,
}: {
  label: string;
  icon: React.ReactNode;
  accept: string;
  value: Picked | null;
  onChange: (f: Picked) => void;
  onClear: () => void;
  preview?: boolean;
}) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const take = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    onChange({ name: f.name, size: f.size, url: URL.createObjectURL(f) });
  };

  if (value) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 rounded-none border border-line bg-ink-900/60 p-3"
      >
        {preview && value.url ? (
          <img src={value.url} alt="" className="h-[68px] w-[51px] rounded-[2px] object-cover" />
        ) : (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[2px] border border-line text-brand">
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px]">{value.name}</div>
          <div className="mono text-muted-dim">{formatBytes(value.size)}</div>
        </div>
        <button
          onClick={onClear}
          className="grid h-8 w-8 place-items-center rounded-[2px] text-muted transition-colors hover:bg-ink-700 hover:text-bone"
          aria-label="移除文件"
        >
          <Trash size={14} />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        take(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
      animate={{ scale: over ? 1.008 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-none border-2 border-dashed px-4 py-9 text-center transition-colors ${
        over ? 'border-brand bg-brand/8' : 'border-line hover:border-line-bright hover:bg-white/2'
      }`}
    >
      <motion.span
        animate={over ? { y: -3 } : { y: 0 }}
        className={over ? 'text-brand' : 'text-muted'}
      >
        {icon}
      </motion.span>
      <span className="text-[13px] text-bone-dim">{label}</span>
      <span className="text-[11.5px] text-muted-dim">单个文件最大 2 GB（演示）</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => take(e.target.files)}
      />
    </motion.div>
  );
}
