import { lazy, Suspense, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const DynamicThankYou = lazy(() => import('./DynamicThankYou'));
const DynamicThankYouV2 = lazy(() => import('./DynamicThankYouV2'));

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '/api');

const Spinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#fafaf9]">
    <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-neutral-200 border-t-teal-600"/>
  </div>
);

export default function ThankYouRouter() {
  const { slug } = useParams<{ slug: string }>();
  const [version, setVersion] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    axios.get(`${API_URL}/templates/public/${slug}`)
      .then(r => {
        try {
          const cfg = JSON.parse(r.data.template.config);
          setVersion(cfg.templateVersion === 2 ? 2 : 1);
        } catch { setVersion(1); }
      })
      .catch(() => setVersion(1));
  }, [slug]);

  if (version === null) return <Spinner />;

  return (
    <Suspense fallback={<Spinner />}>
      {version === 2 ? <DynamicThankYouV2 /> : <DynamicThankYou />}
    </Suspense>
  );
}
