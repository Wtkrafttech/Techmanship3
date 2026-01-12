
import React from 'react';
import { Send, MessageSquare, Twitter, Globe, Terminal } from 'lucide-react';

export const Contact = () => {
  return (
    <div className="container mx-auto px-4 py-24 max-w-2xl">
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-foreground/5 rounded-full mb-8 border border-foreground/10">
          <Terminal className="w-10 h-10" />
        </div>
        <h1 className="text-5xl font-black tracking-tight mb-4 uppercase italic">Let's Build</h1>
        <p className="text-xl text-muted-foreground">Have a specific tech vision? We specialize in custom script development, automation software, and tailored HTML architectures.</p>
      </div>

      <div className="space-y-6">
        <a 
          href="https://t.me/techmanship" 
          target="_blank" 
          rel="noreferrer"
          className="group flex items-center justify-between p-8 bg-card border rounded-3xl hover:border-blue-500/50 transition-all shadow-xl"
        >
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <Send className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-xl mb-1 italic uppercase">Telegram HQ</h3>
              <p className="text-sm text-muted-foreground">Direct line for custom tech quotes & support.</p>
            </div>
          </div>
          <span className="font-mono text-sm opacity-50 group-hover:opacity-100 transition-opacity">@techmanship</span>
        </a>

        <div className="grid grid-cols-2 gap-6">
           <a 
            href="#" 
            className="group p-6 bg-card border rounded-3xl hover:border-foreground/30 transition-all text-center"
          >
            <Twitter className="w-8 h-8 mx-auto mb-4 text-muted-foreground group-hover:text-sky-400 transition-colors" />
            <h4 className="font-bold uppercase text-xs tracking-widest">Twitter / X</h4>
          </a>
           <a 
            href="#" 
            className="group p-6 bg-card border rounded-3xl hover:border-foreground/30 transition-all text-center"
          >
            <Globe className="w-8 h-8 mx-auto mb-4 text-muted-foreground group-hover:text-green-400 transition-colors" />
            <h4 className="font-bold uppercase text-xs tracking-widest">Portfolio</h4>
          </a>
        </div>

        <div className="bg-zinc-950 border border-dashed border-white/10 p-10 rounded-3xl text-center space-y-4">
          <h3 className="text-xl font-bold tracking-tight uppercase italic">Enterprise Tech</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">For wholesale script licensing, custom scraper protocols, or long-term software engineering partnerships.</p>
          <div className="pt-4">
            <button className="bg-foreground text-background px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl">
              Initiate Consultation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
