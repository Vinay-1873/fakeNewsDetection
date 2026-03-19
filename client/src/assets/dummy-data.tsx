import { RadarIcon, ShieldCheckIcon, LanguagesIcon } from 'lucide-react';

export const featuresData = [
    {
        icon: <RadarIcon className="w-6 h-6" />,
        title: 'Real-time Misinformation Detection',
        desc: 'Scan headlines, social posts and long-form articles in seconds with confidence scoring and instant risk flags.'
    },
    {
        icon: <ShieldCheckIcon className="w-6 h-6" />,
        title: 'Source Credibility Engine',
        desc: 'Trace article origin, domain reputation and citation quality so your team can verify before publishing.'
    },
    {
        icon: <LanguagesIcon className="w-6 h-6" />,
        title: 'Multilingual Claim Analysis',
        desc: 'Analyze claims in multiple languages and get explainable outputs your editors and analysts can trust.'
    }
];

export const plansData = [
    {
        id: 'starter',
        name: 'Starter',
        price: '$0',
        desc: 'For students and small content teams.',
        credits: 'month',
        features: [
            'Up to 200 article checks',
            'Headline risk scoring',
            'Basic source lookup',
            'Community support'
        ]
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$29',
        desc: 'For independent creators and fast-growing newsrooms.',
        credits: 'month',
        features: [
            'Everything in Starter',
            '5,000 article checks',
            'URL + text + API scanning',
            'Explainable verdict insights',
            'Priority support'
        ],
        popular: true
    },
    {
        id: 'ultra',
        name: 'Enterprise',
        price: 'Custom',
        desc: 'For media organizations, platforms and research labs.',
        credits: 'plan',
        features: [
            'Everything in Pro',
            'Custom model tuning',
            'SLA and audit logs',
            'Team permissions and SSO',
            'Dedicated success manager'
        ]
    }
];

export const faqData = [
    {
        question: 'How does your model decide if news is fake?',
        answer: 'Our pipeline combines NLP classifiers, source authority signals and claim-consistency checks. Each prediction includes explainable factors, not just a single label.'
    },
    {
        question: 'Can I check social media posts and article URLs?',
        answer: 'Yes. You can paste raw text, submit links and use our API to process content from social feeds or CMS workflows.'
    },
    {
        question: 'Do you support languages other than English?',
        answer: 'Yes. The model supports multilingual analysis and can be extended for region-specific datasets when needed.'
    },
    {
        question: 'Is user data private and secure?',
        answer: 'We follow strict data minimization policies, encrypted transport and role-based access controls. Enterprise plans also include audit logs and retention controls.'
    }
];

export const footerLinks = [
    {
        title: "Product",
        links: [
            { name: "Home", url: "/#" },
            { name: "Features", url: "/#features" },
            { name: "Pricing", url: "/#pricing" },
            { name: "FAQ", url: "/#faq" }
        ]
    },
    {
        title: "Legal",
        links: [
            { name: "Privacy Policy", url: "#" },
            { name: "Terms of Service", url: "#" }
        ]
    },
    {
        title: "Resources",
        links: [
            { name: "Documentation", url: "#" },
            { name: "API Reference", url: "#" },
            { name: "Status", url: "#" }
        ]
    }
];