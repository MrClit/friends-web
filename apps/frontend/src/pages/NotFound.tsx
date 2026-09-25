import { useTranslation } from 'react-i18next';
import { MdSearchOff } from 'react-icons/md';
import { FullPageMessage } from '@/shared/components';
import { MainLayout } from './MainLayout';

export function NotFound() {
  const { t } = useTranslation('notFound');

  return (
    <MainLayout>
      <FullPageMessage
        icon={MdSearchOff}
        title={t('title')}
        message={t('message')}
        primaryAction={{ label: t('goHome'), to: '/' }}
      />
    </MainLayout>
  );
}
