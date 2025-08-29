import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: ["class"],
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/**/*.{js,ts,jsx,tsx,mdx}"
	],
	theme: {
    	container: {
    		center: true,
    		padding: '1rem',
    		screens: {
    			'2xl': '1280px'
    		}
    	},
    	extend: {
    				colors: {
			brand: "var(--brand)",
			accent: "var(--accent)",
			bg: "var(--bg)",
			fg: "var(--fg)",
			muted: "var(--muted)",
			border: "var(--border)",
			card: "var(--card)",
			// Keep existing shadcn colors for compatibility
			input: 'hsl(var(--input))',
			ring: 'hsl(var(--ring))',
			background: 'hsl(var(--background))',
			foreground: 'hsl(var(--foreground))',
			primary: {
				DEFAULT: 'hsl(var(--primary))',
				foreground: 'hsl(var(--primary-foreground))'
			},
			secondary: {
				DEFAULT: 'hsl(var(--secondary))',
				foreground: 'hsl(var(--secondary-foreground))'
			},
			destructive: {
				DEFAULT: 'hsl(var(--destructive))',
				foreground: 'hsl(var(--destructive-foreground))'
			},
			popover: {
				DEFAULT: 'hsl(var(--popover))',
				foreground: 'hsl(var(--popover-foreground))'
			},
			chart: {
				'1': 'hsl(var(--chart-1))',
				'2': 'hsl(var(--chart-2))',
				'3': 'hsl(var(--chart-3))',
				'4': 'hsl(var(--chart-4))',
				'5': 'hsl(var(--chart-5))'
			}
		},
    				borderRadius: {
			xl: "var(--radius)",
			"2xl": "calc(var(--radius) + 8px)",
			lg: 'var(--radius)',
			md: 'calc(var(--radius) - 2px)',
			sm: 'calc(var(--radius) - 4px)'
		},
    		fontFamily: {
    			sans: [
    				'var(--font-sans)',
    				'system-ui',
    				'sans-serif'
    			],
    			serif: [
    				'var(--font-serif)',
    				'Georgia',
    				'serif'
    			]
    		},
    				keyframes: {
			'accordion-down': {
				from: {
					height: '0'
				},
				to: {
					height: 'var(--radix-accordion-content-height)'
				}
			},
			'accordion-up': {
				from: {
					height: 'var(--radix-accordion-content-height)'
				},
				to: {
					height: '0'
				}
			},
			'shimmer': {
				'0%': {
					transform: 'translateX(-100%)'
				},
				'100%': {
					transform: 'translateX(100%)'
				}
			}
		},
    				animation: {
			'accordion-down': 'accordion-down 0.2s ease-out',
			'accordion-up': 'accordion-up 0.2s ease-out',
			'shimmer': 'shimmer 1.6s infinite'
		},
		boxShadow: {
			soft: "0 10px 30px rgba(0,0,0,.06)"
		}
    	}
    },
	plugins: [require("tailwindcss-animate")]
};

export default config;
