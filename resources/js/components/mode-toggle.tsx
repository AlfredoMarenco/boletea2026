import { Moon, Sun } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';
import { Button } from '@/components/ui/button';

export function ModeToggle() {
    const { appearance, resolvedAppearance, updateAppearance } = useAppearance();

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
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
