import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  FileText,
  ArrowLeft,
  AlertTriangle,
  Scale,
  ExternalLink,
  Lock,
  Database,
  Globe,
  Radio,
  Clock,
  Building,
  UserCheck,
  Printer,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import iconSvg from '../assets/sentinmail-icon.svg';

export default function TermsView({ onNavigateBack, onNavigateSignup }) {
  const [activeSection, setActiveSection] = useState('acceptance');

  const sections = [
    { id: 'disclaimer', label: 'Draft & Legal Notice', icon: AlertTriangle },
    { id: 'privacy-notice', label: 'Privacy Policy Notice', icon: Lock },
    { id: 'acceptance', label: '1. Acceptance & Eligibility', icon: UserCheck },
    { id: 'authorization', label: '2. Email Submission Authorization', icon: ShieldCheck },
    { id: 'permitted-use', label: '3. Permitted & Prohibited Use', icon: Scale },
    { id: 'data-handling', label: '4. Pipeline Data Handling & Storage', icon: Database },
    { id: 'limits-scoring', label: '5. Limits of Threat Scoring & GeoIP', icon: ShieldAlert },
    { id: 'third-party', label: '6. Third-Party Integrations', icon: Globe },
    { id: 'availability', label: '7. Service Availability & Security', icon: Radio },
    { id: 'ip-terms', label: '8. Intellectual Property & Changes', icon: FileText },
    { id: 'governing-law', label: '9. Governing Law & Jurisdiction', icon: Scale },
    { id: 'contact', label: '10. Contact Details & Placeholders', icon: Building },
  ];

  const scrollTo = (id) => {
    setActiveSection(id);
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Top Action & Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={onNavigateBack}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded p-1"
          aria-label="Back to dashboard or previous view"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateSignup && (
            <button
              onClick={onNavigateSignup}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 shadow-sm"
            title="Print or export as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Print Terms</span>
          </button>
        </div>
      </div>

      {/* Hero Title Card */}
      <header className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-cyan-500 to-emerald-500" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                Document Draft v2026-11-v1
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-violet-500/10 border border-violet-500/25 text-violet-700 dark:text-violet-300">
                Effective: November 12, 2026
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              SentinMail Platform Terms &amp; Conditions
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Standard operating terms, authorized message intake covenants, decision-support score limitations,
              and acceptable usage terms for the SentinMail forensic analysis environment.
            </p>
          </div>

          <div className="shrink-0 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              Document Registry
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Version: <span className="font-semibold text-slate-700 dark:text-slate-300">2026-11-v1</span></div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Status: <span className="text-amber-600 dark:text-amber-400 font-semibold">Requires Legal Review</span></div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Scope: <span className="font-semibold text-slate-700 dark:text-slate-300">Decision-Support Forensic Station</span></div>
          </div>
        </div>
      </header>

      {/* Mandatory Legal & Privacy Advisory Callouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Callout 1: Draft Status & Legal Review Disclaimer */}
        <section
          id="disclaimer"
          aria-labelledby="disclaimer-title"
          className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 shadow-sm space-y-2"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <h2 id="disclaimer-title" className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
              Legal Review Advisory (Draft Status)
            </h2>
          </div>
          <p className="text-xs text-amber-950 dark:text-amber-100/90 leading-relaxed">
            <strong>Important Notice:</strong> This document represents a structural draft provided for software testing,
            operational alignment, and defensive architectural review. It <strong>must be reviewed, tailored, and approved by
            a qualified legal professional</strong> licensed in the operating organization's jurisdiction prior to public,
            commercial, or institutional deployment. SentinMail does not provide legal advice or warrant that this template
            satisfies statutory compliance requirements in any particular jurisdiction.
          </p>
        </section>

        {/* Callout 2: Strict Privacy Policy Separation Notice */}
        <section
          id="privacy-notice"
          aria-labelledby="privacy-notice-title"
          className="p-5 rounded-2xl bg-violet-50/80 dark:bg-violet-950/30 border border-violet-300 dark:border-violet-800/60 shadow-sm space-y-2"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
            <h2 id="privacy-notice-title" className="text-xs font-bold text-violet-900 dark:text-violet-200 uppercase tracking-wider">
              Notice Regarding Privacy Policy
            </h2>
          </div>
          <p className="text-xs text-violet-950 dark:text-violet-100/90 leading-relaxed">
            <strong>Strict Separation:</strong> These Terms and Conditions govern platform rights, user obligations, and
            acceptable usage. They <strong>are strictly separate from and DO NOT SUBSTITUTE for an official Privacy Policy</strong>.
            Prior to public launch, the project owner must publish an independent Privacy Policy detailing personal data
            collection, controller identification, GDPR/CCPA consumer rights, cookie/token storage, and retention intervals.
          </p>
          <div className="pt-1 text-[11px] text-violet-800 dark:text-violet-300 font-mono">
            Placeholder: <span className="underline decoration-dotted font-semibold">[Link to Privacy Policy: https://sentinmail.org/privacy — To be supplied before public launch]</span>
          </div>
        </section>
      </div>

      {/* Main Layout: Sticky Navigator + Terms Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Table of Contents / Section Navigator (Sticky Sidebar on desktop) */}
        <nav
          aria-label="Terms and Conditions Table of Contents"
          className="lg:col-span-1 bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-lg lg:sticky lg:top-20 space-y-1"
        >
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 px-2 py-1 mb-1 uppercase tracking-wider font-mono">
            Table of Contents
          </div>
          <div className="space-y-1">
            {sections.map((item) => {
              const Icon = item.icon;
              const isSelected = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                    isSelected
                      ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Icon className="w-3.5 h-3.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <ChevronRight className="w-3 h-3 shrink-0 opacity-40" />
                </button>
              );
            })}
          </div>
        </nav>

        {/* Detailed Terms Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Section 1: Acceptance of Terms & Eligibility */}
          <article
            id="acceptance"
            className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-md space-y-3"
          >
            <div className="flex items-center gap-2.5 text-cyan-600 dark:text-cyan-400">
              <UserCheck className="w-5 h-5 shrink-0" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                1. Acceptance of Terms &amp; Eligibility
              </h2>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
              <p>
                By accessing, browsing, registering for an analyst account, or submitting any data to SentinMail
                (the &ldquo;Platform&rdquo;, &ldquo;Service&rdquo;, or &ldquo;Software&rdquo;), operated by{' '}
                <mark className="bg-amber-200 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 px-1 py-0.5 rounded font-mono">[Organization / Project Owner Name]</mark>
                {' '}(&ldquo;Operator&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), you (&ldquo;User&rdquo;,
                &ldquo;Analyst&rdquo;, or &ldquo;You&rdquo;) agree to be legally bound by these Terms and Conditions (&ldquo;Terms&rdquo;).
                If you do not agree to these Terms in their entirety, you must not access or use the Platform.
              </p>
              <p>
                <strong>Eligibility Requirements:</strong> You represent and warrant that:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
                <li>
                  You are at least <mark className="bg-amber-200 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 px-1 py-0.5 rounded font-mono">[e.g. 18 years of age or the age of legal majority in your jurisdiction]</mark>.
                </li>
                <li>
                  If you are registering on behalf of an enterprise, corporation, government department, academic institution,
                  or Security Operations Center (SOC), you possess the requisite authority to bind that entity to these Terms.
                </li>
                <li>
                  Your use of SentinMail complies with all applicable national, federal, state, and local laws, cybercrime statutes,
                  and export control regulations.
                </li>
              </ul>
            </div>
          </article>

          {/* Section 2: User Responsibility & Email Submission Authorization */}
          <article
            id="authorization"
            className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-md space-y-3"
          >
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                2. User Responsibility &amp; Email Submission Authorization
              </h2>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
              <p>
                SentinMail is an investigative utility intended solely for authorized security assessment, incident response,
                and technical threat triage. The integrity of digital communications analysis rests upon lawful acquisition.
              </p>
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 font-medium">
                <strong>Warranty of Authorization:</strong> You expressly represent and warrant that you own, operate, or
                have obtained written authorization from the mailbox owner, recipient, or employing organization to upload,
                parse, disassemble, and analyze every email message, RFC 5322 packet, header sequence, attachment, and URL submitted to the Service.
              </div>
              <p>
                <strong>Strict Prohibitions Regarding Intercepted Communications:</strong> You agree NOT to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
                <li>
                  Submit communications obtained without consent through illicit wiretapping, packet sniffing, unauthorized
                  credential harvesting, mailbox compromise, or violation of the Computer Fraud and Abuse Act (CFAA), Electronic
                  Communications Privacy Act (ECPA), or foreign equivalents.
                </li>
                <li>
                  Submit third-party private communications where you have no legitimate investigative role or authorization.
                </li>
                <li>
                  Upload sensitive personally identifiable information (PII), patient health data (HIPAA), or cardholder payment data (PCI-DSS)
                  unless sanitized or strictly required under enterprise incident response protocols.
                </li>
              </ul>
            </div>
          </article>

          {/* Section 3: Permitted Cybersecurity Use & Prohibited Activity */}
          <article
            id="permitted-use"
            className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-md space-y-3"
          >
            <div className="flex items-center gap-2.5 text-violet-600 dark:text-violet-400">
              <Scale className="w-5 h-5 shrink-0" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                3. Permitted Cybersecurity Use &amp; Prohibited Activity
              </h2>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
              <p>
                <strong>Permitted Use:</strong> Users are granted a limited, revocable, non-exclusive, non-transferable license
                to use SentinMail for lawful cybersecurity analysis, including:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
                <li>Evaluating suspicious inbound emails for phishing, BEC, spoofing, and malicious payloads.</li>
                <li>Inspecting cryptographic SPF, DKIM, and DMARC alignment and mail relay routing hops.</li>
                <li>Verifying forensic SHA256 integrity trees for enterprise incident investigation.</li>
                <li>Auditing Indicators of Compromise (IoCs) to defend corporate or personal digital perimeter.</li>
              </ul>
              <p>
                <strong>Prohibited Activities:</strong> In using the Platform, you agree not to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
                <li>
                  <strong>Adversarial Evasion Research:</strong> Use model outputs or scoring heuristics to reverse-engineer
                  filters, train evasion algorithms, or optimize malicious campaigns to bypass security controls.
                </li>
                <li>
                  <strong>Live Malware Execution:</strong> Attempt to exploit, trigger, or detonate live executable payloads
                  on the host server or within client browsers.
                </li>
                <li>
                  <strong>Denial of Service &amp; Abuse:</strong> Overload the API via automated scraping, flood attacks,
                  or attempts to disrupt service availability.
                </li>
                <li>
                  <strong>Unauthorized Access:</strong> Probe, port-scan, circumvent role-based access controls, or access
                  cases belonging to other organizations without explicit authorization.
                </li>
              </ul>
            </div>
          </article>

          {/* Section 4: Pipeline Data Handling & Storage */}
          <article
            id="data-handling"
            className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-md space-y-3"
          >
            <div className="flex items-center gap-2.5 text-cyan-600 dark:text-cyan-400">
              <Database className="w-5 h-5 shrink-0" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                4. Pipeline Data Handling, Storage &amp; Retention
              </h2>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
              <p>
                To provide forensic decision support, SentinMail processes email payloads through an autonomous multi-stage
                pipeline. The actual technical handling is as follows:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Raw RFC 5322 Emails</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Stored in the database case record to enable raw export (.eml), header re-examination, and reproducible forensic evidence audits.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Attachments (Metadata Only)</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Processed for filename, file size, SHA256 cryptographic digest, and suspicious extension heuristics. Binary files are not detonated or executed.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Headers &amp; URLs</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Inspected for RFC authentication (SPF, DKIM, DMARC), intermediate relay IP hops, lexical link deception, and punycode obfuscation.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Cryptographic Chain Head</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    A SHA256 Merkel-style sequence binds raw bytes, parsed artifacts, and timestamp to detect post-investigation tampering.
                  </p>
                </div>
              </div>
              <p>
                <strong>Data Retention &amp; Case Deletion:</strong> Analyzed case records persist in the platform database
                until explicitly deleted by an administrator or for the duration of{' '}
                <mark className="bg-amber-200 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 px-1 py-0.5 rounded font-mono">[Data Retention Period, e.g. 90 days / subject to organizational policy]</mark>.
                Administrators may delete individual cases at any time via the Case Details interface.
              </p>
            </div>
          </article>

          {/* Section 5: The Limits of Threat Scoring, Attribution & Geolocation */}
          <article
            id="limits-scoring"
            className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-md space-y-3"
          >
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                5. Decision-Support Limits: No Detection Guarantee, Attribution, or Judicial Admissibility
              </h2>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-950 dark:text-rose-200 space-y-1">
                <div className="font-bold uppercase tracking-wider text-[11px]">
                  Critical Non-Warranty on Investigative Findings
                </div>
                <p>
                  SentinMail is an investigative decision-support system. It produces probabilistic machine-learning predictions,
                  heuristic risk scores, and approximate network telemetry. Automated findings are subject to inherent algorithmic
                  limitations and must always be corroborated by trained human forensic analysts.
                </p>
              </div>

              <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
                <li>
                  <strong>No Guarantee of Threat Detection:</strong> We do NOT warrant or guarantee that the system will detect
                  all threats, exploits, malware, spoofing, or phishing campaigns (false negatives), nor that flagged items are
                  malicious (false positives). Zero-day exploits, sophisticated spear-phishing, and novel obfuscation may evade detection.
                </li>
                <li>
                  <strong>No Sender Attribution or Physical Location:</strong> IP geolocation is derived from public routing tables
                  and IP context databases. <em>Geolocation reflects server, relay, CDN, VPN, datacenter, or Tor exit node infrastructure—NOT
                  the physical identity, home address, or real-world geographic location of the human sender.</em> SentinMail does NOT
                  identify an attacker or physical sender.
                </li>
                <li>
                  <strong>No Claim of Judicial Admissibility:</strong> While the platform calculates SHA256 evidence integrity chains
                  for internal verification, SentinMail makes no legal claim or warranty that such records constitute admissible judicial evidence,
                  statutory digital forensic certification, or chain of custody under Federal Rules of Evidence (or local court equivalents).
                </li>
              </ul>
            </div>
          </article>

          {/* Section 6: Third-Party Services & Integrations */}
          <article
            id="third-party"
            className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-md space-y-3"
          >
            <div className="flex items-center gap-2.5 text-cyan-600 dark:text-cyan-400">
              <Globe className="w-5 h-5 shrink-0" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                6. Third-Party Services, Feeds &amp; Connectors
              </h2>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
              <p>
                When configured by system administrators, SentinMail may interface with optional external intelligence services:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
                <li>
                  <strong>IP Geolocation Data Providers:</strong> Queries MaxMind GeoLite2 databases or web-based GeoIP APIs
                  (such as <mark className="bg-amber-200 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 px-1 py-0.5 rounded font-mono">[Configured GeoIP Provider, e.g. ipapi.co / MaxMind]</mark>)
                  to obtain approximate country, city, and ASN information for intermediate routing hops.
                </li>
                <li>
                  <strong>External Threat Intelligence (AbuseIPDB):</strong> When an administrator supplies an API key, extracted
                  IPs may be cross-referenced against crowd-sourced malicious IP reputation databases.
                </li>
                <li>
                  <strong>SMTP Alert Dispatchers &amp; IMAP Collectors:</strong> When configured in environment settings, the
                  platform may connect to third-party mail servers (e.g. Gmail, Microsoft 365, or private mail gateways) to ingest reported mail or dispatch threat alerts.
                </li>
              </ul>
              <p>
                SentinMail does not own or control third-party service providers and is not liable for their availability, accuracy,
                downtime, or independent terms and privacy practices.
              </p>
            </div>
          </article>

          {/* Section 7: Service Availability, Account Security & Termination */}
          <article
            id="availability"
            className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-md space-y-3"
          >
            <div className="flex items-center gap-2.5 text-violet-600 dark:text-violet-400">
              <Radio className="w-5 h-5 shrink-0" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                7. Service Availability, Account Security &amp; Termination
              </h2>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
              <p>
                <strong>&ldquo;AS IS&rdquo; Service Provision:</strong> SentinMail is provided on an &ldquo;AS IS&rdquo; and
                &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind, whether express, statutory, or implied, including
                implied warranties of merchantability, fitness for a particular purpose, or uninterrupted uptime.
              </p>
              <p>
                <strong>Account Credentials &amp; Security:</strong> Analysts are solely responsible for maintaining the
                confidentiality of their login credentials (passwords, JWT tokens). You agree to immediately notify the Operator
                of any suspected unauthorized access or token leakage.
              </p>
              <p>
                <strong>Suspension &amp; Termination:</strong> We reserve the right, without prior notice or liability, to suspend,
                restrict, or terminate analyst accounts (<code className="font-mono bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded">disabled: true</code>)
                found to violate these Terms, engage in unlawful message submission, or conduct unauthorized adversarial testing against the Platform.
              </p>
            </div>
          </article>

          {/* Section 8: Intellectual Property & Changes to Terms */}
          <article
            id="ip-terms"
            className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-md space-y-3"
          >
            <div className="flex items-center gap-2.5 text-cyan-600 dark:text-cyan-400">
              <FileText className="w-5 h-5 shrink-0" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                8. Intellectual Property &amp; Changes to Terms
              </h2>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
              <p>
                <strong>Platform IP:</strong> The SentinMail source code, machine learning pipelines, forensic correlation algorithms,
                interface designs, logos, and documentation are the intellectual property of{' '}
                <mark className="bg-amber-200 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 px-1 py-0.5 rounded font-mono">[Organization / Project Owner Name]</mark>
                {' '}and its licensors. All rights not expressly granted herein are reserved.
              </p>
              <p>
                <strong>Submitted Content:</strong> You retain whatever pre-existing rights and ownership you possess in raw email
                messages submitted to the Platform. By submitting messages, you grant the Operator a non-exclusive license solely
                to process, parse, store, and display the analysis as necessary to provide the Service to you.
              </p>
              <p>
                <strong>Revisions to Terms:</strong> We may update these Terms periodically to reflect changes in regulatory standards,
                threat landscapes, or platform features. The current version identifier (e.g. <span className="font-mono font-semibold">2026-11-v1</span>)
                and effective date will always be displayed at the head of this document. Continued usage after modifications
                constitutes acceptance of revised terms.
              </p>
            </div>
          </article>

          {/* Section 9: Governing Law & Jurisdiction */}
          <article
            id="governing-law"
            className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-md space-y-3"
          >
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
              <Scale className="w-5 h-5 shrink-0" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                9. Governing Law, Jurisdiction &amp; Dispute Resolution
              </h2>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
              <p>
                These Terms and any dispute, controversy, or claim arising out of or relating to your use of SentinMail shall
                be governed by, and construed in accordance with, the laws of{' '}
                <mark className="bg-amber-200 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 px-1 py-0.5 rounded font-mono">[Governing Law, e.g. State / Country of Organization Headquarters]</mark>,
                without giving effect to any principles of conflicts of law.
              </p>
              <p>
                Any legal action or proceeding arising under these Terms shall be instituted exclusively in the competent courts located in{' '}
                <mark className="bg-amber-200 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 px-1 py-0.5 rounded font-mono">[Jurisdiction, e.g. City, State, Country]</mark>,
                and each party irrevocably submits to the exclusive personal jurisdiction of such courts.
              </p>
            </div>
          </article>

          {/* Section 10: Organization Details & Legal Inquiries */}
          <article
            id="contact"
            className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-md space-y-3"
          >
            <div className="flex items-center gap-2.5 text-cyan-600 dark:text-cyan-400">
              <Building className="w-5 h-5 shrink-0" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                10. Contact Details &amp; Required Organizational Placeholders
              </h2>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
              <p>
                For questions regarding these Terms, authorized use policies, or forensic coordination, please contact the
                Platform administration team:
              </p>

              {/* Placeholder Reference Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="font-bold text-slate-800 dark:text-slate-200 font-sans text-xs">
                  Project Owner Configuration Placeholders (To Be Filled Prior to Launch):
                </div>
                <div>&bull; Operating Organization: <span className="text-amber-600 dark:text-amber-300 font-semibold">[Organization / Project Owner Name]</span></div>
                <div>&bull; Physical / Registered Address: <span className="text-amber-600 dark:text-amber-300 font-semibold">[Physical Address / Country]</span></div>
                <div>&bull; Legal &amp; Compliance Email: <span className="text-amber-600 dark:text-amber-300 font-semibold">[Contact Email, e.g. legal@sentinmail.org]</span></div>
                <div>&bull; Technical Support Email: <span className="text-amber-600 dark:text-amber-300 font-semibold">[Support Email, e.g. support@sentinmail.org]</span></div>
                <div>&bull; Data Retention Interval: <span className="text-amber-600 dark:text-amber-300 font-semibold">[e.g. 90 Days / Configured Org Lifecycle]</span></div>
                <div>&bull; Governing Jurisdiction: <span className="text-amber-600 dark:text-amber-300 font-semibold">[State / Country Jurisdiction]</span></div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Terms Version: 2026-11-v1 &bull; SentinMail Forensics Station</span>
                <button
                  type="button"
                  onClick={onNavigateBack}
                  className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
                >
                  Return to Top / Dashboard &uarr;
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
