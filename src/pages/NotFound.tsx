
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-jd-bg p-4">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-jd-purple">404</h1>
        <h2 className="text-2xl font-medium">Page Not Found</h2>
        <p className="text-jd-mutedText max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved to another URL.
        </p>
        <div className="pt-4">
          <Link to="/">
            <Button className="bg-jd-purple hover:bg-jd-darkPurple">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
