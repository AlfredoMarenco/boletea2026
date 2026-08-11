import { Moon, Sun } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';
import { Button } from '@/components/ui/button';

export function ModeToggle() {
    const { appearance, resolvedAppearance, updateAppearance } =
        useAppearance();

    const toggleTheme = () => {
        if (resolvedAppearance === 'dark') {
            updateAppearance('light');
        } else {
            updateAppearance('dark');
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-full border border-gray-200 dark:border-border"
            title={`Cambiar tema (actual: ${appearance === 'system' ? 'Sistema' : resolvedAppearance === 'dark' ? 'Oscuro' : 'Claro'})`}
        >
            <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
