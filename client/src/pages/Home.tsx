import Hero from "../components/Hero";
import Features from "../components/Features";
import Pricing from "../components/Pricing";
import Testimonials from "../components/Testimonials";
import Faq from "../components/Faq";
import CTA from "../components/CTA";
import Demo from "../components/Demo";

export default function Home() {
    return (
        <>
            <Hero />
            <Demo />
            <Features />
            <Pricing />
            <Testimonials />
            <Faq />
            <CTA />
        </>
    )
}