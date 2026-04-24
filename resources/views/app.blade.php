<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{-- Inline script to detect system dark mode preference and apply it immediately --}}
    <script>
        (function() {
            const appearance = '{{ $appearance ?? 'system' }}';

            if (appearance === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                if (prefersDark) {
                    document.documentElement.classList.add('dark');
                }
            }
        })();
    </script>

    {{-- Inline style to set the HTML background color based on our theme in app.css --}}
    <style>
        html {
            background-color: oklch(1 0 0);
        }

        html.dark {
            background-color: oklch(0.145 0 0);
        }
    </style>

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    <link rel="icon" href="/logo.ico" sizes="any">
    {{--         <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png"> --}}

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700,800,900" rel="stylesheet" />


    @if(isset($meta))
        <!-- Server-side SEO Meta Tags for Social Media Scrapers -->
        <meta name="description" content="{{ $meta['description'] ?? '' }}">
        <meta property="og:title" content="{{ $meta['title'] ?? '' }}">
        <meta property="og:description" content="{{ $meta['description'] ?? '' }}">
        @if(isset($meta['image']) && $meta['image'])
            <meta property="og:image" content="{{ $meta['image'] }}">
        @endif
        <meta property="og:url" content="{{ $meta['url'] ?? Request::url() }}">
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="Boletea">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ $meta['title'] ?? '' }}">
        <meta name="twitter:description" content="{{ $meta['description'] ?? '' }}">
        @if(isset($meta['image']) && $meta['image'])
            <meta name="twitter:image" content="{{ $meta['image'] }}">
        @endif
    @endif

    @viteReactRefresh
    @routes
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    @inertiaHead

    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XG674XTGDN"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'G-XG674XTGDN');
    </script>
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>
