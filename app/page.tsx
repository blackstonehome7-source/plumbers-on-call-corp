import { Hero } from "@/components/home/Hero";
import { PocStandard } from "@/components/home/PocStandard";
import { ServicesShowcase } from "@/components/home/ServicesShowcase";
import { WorkPreview } from "@/components/home/WorkPreview";
import { WhyPoc } from "@/components/home/WhyPoc";
import { AboutBridge } from "@/components/home/AboutBridge";
import { AreaPreview } from "@/components/home/AreaPreview";
import { Testimonials } from "@/components/home/Testimonials";
import { CtaBand } from "@/components/ui/CtaBand";

export default function HomePage() {
  return (
    <>
      <Hero />
      <PocStandard />
      <ServicesShowcase />
      <WorkPreview />
      <WhyPoc />
      <AboutBridge />
      <AreaPreview />
      <Testimonials />
      <CtaBand placement="home" />
    </>
  );
}
