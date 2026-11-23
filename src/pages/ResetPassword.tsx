import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LogoMark } from '@/components/Logo';
import {
  HAS_BACKEND,
  exchangePasswordRecoveryCode,
  friendlyAuthError,
  passwordError,
  recoverFromHash,
  requestPasswordReset,
  updateRecoveredPassword,
} from '@/api/auth';

export default function ResetPassword() {
  const [params, setParams] = useSearchParams();
  const code = params.get('code');
  const requestError = params.has('error') || params.has('error_description');
  const started = useRef(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [recoveryUserId, setRecoveryUserId] = useState('');
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(Boolean(code));
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      try {
        if (code) {
          // PKCE flow：?code= 换 session
          const userId = await exchangePasswordRecoveryCode(code);
          setParams({}, { replace: true });
          setRecoveryUserId(userId);
        } else if (window.location.hash.includes('type=recovery')) {
          // implicit flow：token 在 hash 里（Supabase 邮件模板默认行为）
          const userId = await recoverFromHash();
          if (userId) setRecoveryUserId(userId);
          else setError('重置链接不完整，请重新发送邮件。');
        }
      } catch (err) {
        setError(friendlyAuthError(err));
      } finally {
        setValidating(false);
      }
    })();
  }, [code, setParams]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !HAS_BACKEND) return;
    setError('');
    if (recoveryUserId) {
      const invalid = passwordError(password);
      if (invalid || password !== confirmation) {
        setError(invalid ?? '两次输入的密码不一致');
        return;
      }
    }

    setBusy(true);
    try {
      if (recoveryUserId) {
        await updateRecoveredPassword(recoveryUserId, password);
        setUpdated(true);
        setPassword('');
        setConfirmation('');
      } else {
        await requestPasswordReset(email.trim());
        setSent(true);
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap inner-page auth-page">
      <div className="auth-form">
        <LogoMark size={34} />
        <h1>{recoveryUserId ? '设置新密码' : '找回密码'}</h1>
        {validating ? (
          <p className="mt-4 text-bone-dim" role="status">正在验证重置链接…</p>
        ) : updated ? (
          <p className="mt-4 text-bone-dim" role="status">密码已更新。 <Link className="link-underline" to="/me">前往工作台</Link></p>
        ) : !HAS_BACKEND ? (
          <p className="mt-4 text-bone-dim">当前环境无法发送邮件。</p>
        ) : (
          <form className="mt-7 space-y-4" onSubmit={submit}>
            {recoveryUserId ? (
              <>
                <div>
                  <label className="field-label" htmlFor="new-password">新密码</label>
                  <input className="input" id="new-password" type="password" autoComplete="new-password"
                    value={password} onChange={(event) => setPassword(event.target.value)} required />
                </div>
                <div>
                  <label className="field-label" htmlFor="confirm-password">确认新密码</label>
                  <input className="input" id="confirm-password" type="password" autoComplete="new-password"
                    value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
                </div>
              </>
            ) : (
              <div>
                <label className="field-label" htmlFor="recovery-email">注册邮箱</label>
                <input className="input" id="recovery-email" type="email" autoComplete="email"
                  value={email} onChange={(event) => { setEmail(event.target.value); setSent(false); }} required />
              </div>
            )}
            {(error || (requestError && !sent)) && (
              <p className="text-[13px] text-danger" role="alert">{error || '重置链接已失效，请重新发送。'}</p>
            )}
            {sent && (
              <p className="text-[13px] text-bone-dim" role="status">
                如果该邮箱有账号，你会收到邮件。请在当前浏览器打开邮件里的链接。
              </p>
            )}
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? '处理中…' : recoveryUserId ? '更新密码' : sent ? '重新发送邮件' : '发送重置邮件'}
            </button>
          </form>
        )}
        <Link to="/login" className="link-underline mt-7 inline-block text-[13px] text-bone-dim">返回登录</Link>
      </div>
    </div>
  );
}
