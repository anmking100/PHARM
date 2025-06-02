import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { UserCircle, Settings2 } from 'lucide-react';
import Link from 'next/link';

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings2 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="User Profile">
            <UserCircle className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
