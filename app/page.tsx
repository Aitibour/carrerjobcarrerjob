import Link from 'next/link'
import RotatingText from '@/components/rotating-text'

const features = [
  {
    icon: '📄',
    title: 'Upload your CV',
    desc: 'Drop a PDF, .txt, or .md file — or paste text directly. Processed in seconds.',
    color: 'from-blue-50 to-blue-100',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
  },
  {
    icon: '🔍',
    title: 'Search real jobs',
    desc: 'Live listings from thousands of companies across every industry and location.',
    color: 'from-violet-50 to-violet-100',
    border: 'border-violet-200',
    iconBg: 'bg-violet-100',
  },
  {
    icon: '🎯',
    title: 'AI match scoring',
    desc: 'Get an A–F grade, keyword matches, skill gaps, and a one-line verdict for every role.',
    color: 'from-emerald-50 to-emerald-100',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
  },
  {
    icon: '✨',
    title: 'Tailored CV builder',
    desc: 'One click rewrites your CV for the specific role. Download as markdown instantly.',
    color: 'from-amber-50 to-amber-100',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
  },
  {
    icon: '🔖',
    title: 'Save & track jobs',
    desc: 'Bookmark roles, move them through your pipeline: Saved → Applied → Interview → Offer.',
    color: 'from-pink-50 to-pink-100',
    border: 'border-pink-200',
    iconBg: 'bg-pink-100',
  },
  {
    icon: '📊',
    title: 'Application tracker',
    desc: 'Kanban board to manage every application in one place. Never lose track of a role.',
    color: 'from-cyan-50 to-cyan-100',
    border: 'border-cyan-200',
    iconBg: 'bg-cyan-100',
  },
]

const steps = [
  {
    number: '01',
    title: 'Upload your CV',
    desc: 'Upload a PDF, paste text, or drop a markdown file. Our AI reads and understands your experience instantly.',
    icon: '📄',
  },
  {
    number: '02',
    title: 'Search for jobs',
    desc: 'Enter a job title and location. We pull live listings from thousands of companies in real time.',
    icon: '🔍',
  },
  {
    number: '03',
    title: 'Get your match score',
    desc: 'Click Analyze on any job. AI compares your CV to the job description and gives you a grade A–F with detailed feedback.',
    icon: '🎯',
  },
  {
    number: '04',
    title: 'Build a tailored CV',
    desc: 'One click rewrites your CV specifically for that role — highlighting the right skills, keywords, and experience.',
    icon: '✨',
  },
]

const stats = [
  { value: '10s', label: 'CV upload time' },
  { value: 'A–F', label: 'Match grade system' },
  { value: '1-click', label: 'Tailored CV' },
  { value: 'Free', label: 'No credit card' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-4 pt-24 pb-20 text-center">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 -z-10 animate-float" />
        <div className="absolute top-20 right-1/4 w-72 h-72 bg-violet-100 rounded-full blur-3xl opacity-30 -z-10 animate-float delay-300" />

        <div className="opacity-0-init animate-fade-up">
          <h1 className="text-6xl md:text-7xl font-black text-gray-900 leading-tight mb-6">
            Find jobs that{' '}
            <RotatingText />
            <br />your CV
          </h1>
        </div>

        <div className="opacity-0-init animate-fade-up delay-200">
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your CV. Search real job listings. Get an AI-powered A–F match score
            for every role. Build a tailored CV in one click.
          </p>
        </div>

        <div className="opacity-0-init animate-fade-up delay-400 flex gap-4 justify-center flex-wrap">
          <Link
            href="/auth/signup"
            className="bg-blue-600 text-white rounded-2xl px-8 py-4 font-bold text-base hover:bg-blue-700 transition-all hover:scale-105 shadow-lg shadow-blue-200"
          >
            Get started — it&apos;s free
          </Link>
          <Link
            href="/auth/login"
            className="border-2 border-gray-200 text-gray-700 rounded-2xl px-8 py-4 font-bold text-base hover:border-blue-300 hover:text-blue-600 transition-all"
          >
            Sign in
          </Link>
        </div>

        {/* Stats row */}
        <div className="opacity-0-init animate-fade-up delay-600 mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
          {stats.map((s, i) => (
            <div key={s.label} className={`text-center opacity-0-init animate-counter delay-${(i + 6) * 100}`}>
              <div className="text-3xl font-black text-blue-600">{s.value}</div>
              <div className="text-sm text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              How it works
            </div>
            <h2 className="text-4xl font-black text-gray-900">
              From CV to tailored application in{' '}
              <span className="gradient-text">4 steps</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-200 via-violet-200 to-blue-200" />

            {steps.map((step, i) => (
              <div
                key={step.number}
                className={`relative text-center opacity-0-init animate-fade-up delay-${(i + 1) * 100}`}
              >
                {/* Step number bubble */}
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-white border-2 border-blue-100 shadow-md mb-6 mx-auto">
                  <span className="text-3xl">{step.icon}</span>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white text-xs font-black rounded-full flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-24 max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-block bg-violet-100 text-violet-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Everything you need
          </div>
          <h2 className="text-4xl font-black text-gray-900">
            Your complete job search{' '}
            <span className="gradient-text">toolkit</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`card-hover bg-gradient-to-br ${f.color} border ${f.border} rounded-3xl p-7 opacity-0-init animate-fade-up delay-${(i + 1) * 100}`}
            >
              <div className={`${f.iconBg} w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4`}>
                {f.icon}
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Grade showcase */}
      <section className="bg-gray-900 py-24 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 text-white">
            <div className="inline-block bg-blue-500/20 text-blue-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              AI match scoring
            </div>
            <h2 className="text-4xl font-black mb-6 leading-tight">
              Know your odds{' '}
              <span className="text-blue-400">before you apply</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              Stop applying blindly. Our AI reads your CV against every job description
              and gives you a clear grade, matched keywords, skill gaps, and a one-line verdict.
            </p>
            <Link
              href="/auth/signup"
              className="inline-block bg-blue-600 text-white rounded-2xl px-7 py-3.5 font-bold hover:bg-blue-500 transition-all hover:scale-105"
            >
              Try it free →
            </Link>
          </div>

          {/* Grade cards demo */}
          <div className="flex-1 flex flex-col gap-3 w-full max-w-sm mx-auto">
            {[
              { grade: 'A+', label: 'Senior Frontend Engineer at Stripe', score: 94, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
              { grade: 'B+', label: 'Full-Stack Developer at Shopify', score: 78, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
              { grade: 'C',  label: 'Data Scientist at Meta', score: 52, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
            ].map((item, i) => (
              <div
                key={item.grade}
                className={`card-hover ${item.bg} border rounded-2xl p-4 flex items-center gap-4 opacity-0-init animate-slide-left delay-${(i + 2) * 200}`}
              >
                <div className={`text-3xl font-black ${item.color} w-12 text-center`}>{item.grade}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{item.label}</div>
                  <div className="mt-1.5 bg-gray-700 rounded-full h-1.5 w-full">
                    <div
                      className={`h-1.5 rounded-full ${item.color.replace('text-', 'bg-')}`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
                <div className={`text-sm font-bold ${item.color}`}>{item.score}%</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-5xl font-black text-gray-900 mb-6">
            Ready to find your{' '}
            <span className="gradient-text">perfect job?</span>
          </h2>
          <p className="text-gray-500 text-lg mb-10">
            Join thousands of job seekers using RadarJobs to land interviews faster.
            No credit card required.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block bg-blue-600 text-white rounded-2xl px-10 py-5 font-bold text-lg hover:bg-blue-700 transition-all hover:scale-105 shadow-xl shadow-blue-200"
          >
            Get started — it&apos;s free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} RadarJobs · Built with AI · Free to use
      </footer>
    </div>
  )
}
