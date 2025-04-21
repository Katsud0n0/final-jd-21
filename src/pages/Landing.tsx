
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Landing = () => {
  const features = [
    {
      icon: "🎯",
      title: "Centralized Request Management",
      description: "Submit and track requests to any department through a single unified interface. Eliminates the need for redundant paperwork."
    },
    {
      icon: "🔄",
      title: "Interdepartmental Collaboration",
      description: "Connect departments for efficient communication and coordination. Breaks down silos between municipal services."
    },
    {
      icon: "⚡",
      title: "Real-time Status Updates",
      description: "Receive instant updates on your requests as they progress through various stages. No more waiting for responses."
    },
    {
      icon: "🏢",
      title: "Multiple Department Access",
      description: "Interface with Water, Electricity, Health, and other municipal departments through a single platform."
    },
    {
      icon: "📊",
      title: "Advanced Analytics",
      description: "Gain insights from comprehensive data analytics on city-wide service requests and resolution metrics."
    },
    {
      icon: "📝",
      title: "Transparent Workflow",
      description: "Track the complete lifecycle of your request with a transparent process that builds trust in municipal services."
    }
  ];

  return (
    <div className="min-h-screen bg-jd-bg text-jd-text flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-2xl font-bold">JD</span>
          <span className="text-2xl font-medium text-jd-purple ml-2">Frameworks</span>
        </div>
        <div className="space-x-4">
          <Link to="/login">
            <Button variant="outline" className="border-jd-purple text-jd-purple hover:bg-jd-purple/10">
              Log in
            </Button>
          </Link>
          <Link to="/register">
            <Button className="bg-jd-purple hover:bg-jd-darkPurple">
              Register
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center p-6 max-w-5xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          JD <span className="text-jd-purple">Frameworks</span>
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl">
          A unified platform for interdepartmental cooperation and streamlined communication.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/dashboard">
            <Button className="bg-jd-purple hover:bg-jd-darkPurple text-lg py-6 px-8">
              Go to Dashboard
            </Button>
          </Link>
          <Link to="/departments">
            <Button variant="outline" className="border-white hover:bg-white/10 text-lg py-6 px-8">
              Explore Departments →
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-jd-card/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-jd-card p-8 rounded-lg">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-jd-mutedText">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Get Started Today</h2>
          <p className="text-xl mb-8 text-jd-mutedText">
            Join the platform that's transforming interdepartmental cooperation in Indian cities.
          </p>
          <Link to="/register">
            <Button className="bg-jd-purple hover:bg-jd-darkPurple text-lg py-6 px-12">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-jd-card/80 border-t border-jd-card">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              <span className="text-xl font-bold">JD</span>
              <span className="text-xl font-medium text-jd-purple ml-2">Frameworks</span>
            </div>
            <p className="text-sm text-jd-mutedText">© 2025 JD Frameworks. All rights reserved.</p>
          </div>
          <div className="flex space-x-8">
            <a href="#" className="text-jd-mutedText hover:text-jd-purple">Privacy</a>
            <a href="#" className="text-jd-mutedText hover:text-jd-purple">Terms</a>
            <a href="#" className="text-jd-mutedText hover:text-jd-purple">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
