import { Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';

export default function Register() {
    return (
        <AuthLayout
            title="Create an account"
            description="Registration is currently disabled."
        >
            <Head title="Register" />
            <div className="flex flex-col gap-6 text-center">
                <p className="text-muted-foreground">
                    Registration is currently disabled for this application.
                </p>
                <div className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <TextLink href={login()} tabIndex={6}>
                        Log in
                    </TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}
