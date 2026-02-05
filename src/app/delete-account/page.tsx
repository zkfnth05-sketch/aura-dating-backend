'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

export default function DeleteAccountPage() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('delete_account_page_title')}</CardTitle>
          <CardDescription>{t('delete_account_page_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 text-sm text-foreground/80">
            <p>
              {t('delete_account_page_info1')}
            </p>
            <p className="font-semibold">
              {t('delete_account_page_info2')}
            </p>
            <ol className="list-decimal list-inside space-y-2 pl-4 bg-card p-4 rounded-md border">
              <li>{t('delete_account_step1')}</li>
              <li>{t('delete_account_step2').replace('%s', t('delete_account_step2_target'))}</li>
              <li>{t('delete_account_step3').replace('%s', t('delete_account_step3_target'))}</li>
              <li>{t('delete_account_step4').replace('%s', t('delete_account_step4_target'))}</li>
              <li>{t('delete_account_step5')}</li>
            </ol>
            <p>
              {t('delete_account_page_info3')}
            </p>
            <p>
              {t('delete_account_page_info4')}
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              {t('go_home_button')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
