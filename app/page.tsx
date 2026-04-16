import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-block bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
          Free · Powered by Gemini 2.0 Flash
        </div>
        <h1 className="text-5xl font-black text-gray-900 leading-tight mb-4">
          Find jobs that <span className="text-blue-600">actually match</span> your CV
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
          Upload your CV. Search real jobs. Get an A–F match score for every role.
          Build a tailored CV in seconds.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/auth/signup"
            className="bg-blue-600 text-white rounded-xl px-6 py-3 font-semibold hover:bg-blue-700 text-sm"
          >
            Get started free
          </Link>
          <Link
            href="/auth/login"
            className="border border-gray-300 text-gray-700 rounded-xl px-6 py-3 font-semibold hover:bg-gray-50 text-sm"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '📄', title: 'Upload your CV', desc: 'Drop a PDF, .txt, or .md file. Or paste directly. Takes 10 seconds.' },
            { icon: '🔍', title: 'Search real jobs', desc: 'Live listings from Adzuna — Indeed, LinkedIn, and more — by title and location.' },
            { icon: '🎯', title: 'AI match scoring', desc: 'Gemini reads your CV against every job and gives you a grade, strengths, and gaps.' },
          ].map(f => (
            <div key={f.title} className="bg-gray-50 rounded-2xl p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
