/**
 * OAuth 回调落地页。
 * GitHub 授权后会带着 ?code=... 跳到这里，本页把 code 换成 session，
 * user 状态由 AppStore 的 onAuthChange 接管，然后送回原页面。
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogoMark } from '@/components/Logo';
import { exchangeOAuthCode, friendlyAuthError } from '@/api/auth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [err, setErr] = useState('');
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const code = params.get('code');
    const from = params.get('from') || '/me';
    const authError = params.get('error_description') || params.get('error');

    if (authError) {
      setErr(friendlyAuthError(authError));
      return;
    }
    if (!code) {
      setErr('登录回调缺少凭证，请重新发起登录');
      return;
    }

    void exchangeOAuthCode(code)
      .then(() => navigate(from, { replace: true }))
      .catch((ex) => setErr(friendlyAuthError(ex)));
  }, [params, navigate]);

  return (
    <div className="wrap flex min-h-[68vh] items-center justify-center py-16">
      <div className="w-full max-w-[420px]">
        <LogoMark size={36} />
        <h1 className="serif-title mt-7 text-[28px]">
          {err ? '登录没成功' : '正在登录…'}
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          {err ? err : '正在和 GitHub 确认身份，马上就好。'}
        </p>
        {err && (
          <Link to="/login" className="link-underline mt-6 inline-block text-[13px] text-bone-dim hover:text-bone">
            返回登录页重试
          </Link>
        )}
      </div>
    </div>
  );
}
