"use client";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import Image from "next/image";
import { AsciiArt } from "@/components/ui/ascii-art";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";
import LightRays from "@/components/LightRays";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans relative overflow-hidden">
      {/* Global Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <LightRays
          className="w-full h-full"
          raysColor="#a855f7"
          raysOrigin="top-center"
          lightSpread={1.5}
          rayLength={1.5}
        />
      </div>

      {/* Top Banner */}
      <section className="w-full relative z-10 flex flex-col items-center justify-center pt-20 pb-10">

        <div className="relative w-full max-w-4xl mx-auto flex items-center justify-center">
          {/* Using the Ascii Art as a banner background or main visual */}
          <AsciiArt
            src="/trust_issues_logo_only_text_no_bg.png"
            resolution={100}
            color="var(--color-neutral-500)"
            animationStyle="fade"
            animationDuration={1.5}
            animateOnView={false}
            className="mx-auto aspect-square w-full max-w-lg bg-neutral-950"
          />
        </div>
      </section>

      {/* Main Content using Canvas Reveal */}
      <section className="py-24 flex flex-col lg:flex-row items-center justify-center w-full gap-8 mx-auto px-8 max-w-[1400px] z-10 relative">
        {/* Left Card */}
        <Card title="Trust Issues">
          <CanvasRevealEffect
            animationSpeed={5.1}
            containerClassName="bg-emerald-900"
          />
          <div className="absolute inset-0 [mask-image:radial-gradient(400px_at_center,white,transparent)] bg-black/50 dark:bg-black/90" />
          <div className="absolute inset-0 flex items-center justify-center p-8 text-center z-20">
            <p className="text-base md:text-lg text-white/90 leading-relaxed font-medium">
              <strong className="text-emerald-400">Trust Issues</strong> is a cross-platform security solution—available as a <strong className="text-emerald-400">Browser Extension and Mobile App</strong>—that uses advanced Artificial Intelligence and Rules to detect phishing attacks in <em className="text-white italic">real-time</em>. Unlike traditional tools that heavily rely on static blocklists, Trust Issues analyzes the "vibe" of websites, SMS messages, and emails using Deep Learning, NLP, and visual analysis to catch zero-day threats on both your computer and smartphone before you click.
            </p>
          </div>
        </Card>

        {/* Center Card */}
        <Card title="The Core">
          <CanvasRevealEffect
            animationSpeed={3}
            containerClassName="bg-black"
            colors={[
              [236, 72, 153],
              [232, 121, 249],
            ]}
            dotSize={2}
          />
          <div className="absolute inset-0 bg-black/50 dark:bg-black/90" />
          <div className="absolute inset-0 flex items-center justify-center p-6 z-20">
            <div className="relative w-56 h-56 md:w-72 md:h-72">
              <Image
                src="/trust_issue_logo_white_no_bg.png"
                alt="Trust Issues Logo"
                fill
                className="object-contain drop-shadow-2xl opacity-90 transition-opacity duration-300 group-hover/canvas-card:opacity-100"
              />
            </div>
          </div>
        </Card>

        {/* Right Card */}
        <Card title="The Threat">
          <CanvasRevealEffect
            animationSpeed={3}
            containerClassName="bg-sky-600"
            colors={[[125, 211, 252]]}
          />
          <div className="absolute inset-0 bg-black/50 dark:bg-black/90" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-20 overflow-y-auto">
            <p className="text-sm md:text-base text-white/90 leading-relaxed font-medium mb-4">
              Phishing attacks have evolved into highly sophisticated cyber threats exploiting human psychology, weak security configurations, and gaps in legacy detection mechanisms. Threat actors now leverage Machine Learning (ML), Deep Learning (DL), and Natural Language Generation (NLG) to create context-aware phishing campaigns that bypass signature- and rule-based security systems.
            </p>
            <p className="text-sm md:text-base text-white/90 leading-relaxed font-medium">
              Attack vectors are no longer limited to email; they now span SMS, instant messaging platforms, and websites using domain spoofing, homoglyph attacks, and redirection chains. The dynamic and polymorphic nature of these attacks has rendered traditional anti-phishing mechanisms—such as static URL blacklists, regex-based filters, and signature matching—ineffective against zero-day exploits.
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}

const Card = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="border border-white/[0.2] group/canvas-card flex items-center justify-center max-w-sm w-full mx-auto p-4 relative h-[35rem] bg-black overflow-hidden rounded-3xl cursor-pointer"
    >
      <Icon className="absolute h-6 w-6 -top-3 -left-3 text-white/50" />
      <Icon className="absolute h-6 w-6 -bottom-3 -left-3 text-white/50" />
      <Icon className="absolute h-6 w-6 -top-3 -right-3 text-white/50" />
      <Icon className="absolute h-6 w-6 -bottom-3 -right-3 text-white/50" />

      {/* Initially visible content */}
      <AnimatePresence>
        {!hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
          >
            <h2 className="text-white text-3xl font-bold tracking-widest uppercase opacity-40 group-hover/canvas-card:opacity-0 transition-opacity duration-300">{title}</h2>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full w-full absolute inset-0"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Icon = ({ className, ...rest }: any) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-6-6h12" />
    </svg>
  );
};
