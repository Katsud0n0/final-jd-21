
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const DemoCredentials = () => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="mt-8 max-w-md mx-auto">
      <Button 
        variant="outline" 
        className="w-full mb-2 flex items-center justify-between bg-jd-bg border-jd-purple/20 text-jd-purple"
        onClick={() => setIsVisible(!isVisible)}
      >
        <span>Demo Credentials</span>
        {isVisible ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
      
      {isVisible && (
        <Alert variant="default" className="bg-jd-bg border-jd-purple/30">
          <AlertCircle className="h-4 w-4 text-jd-purple" />
          <AlertTitle className="text-jd-purple">Demo Credentials</AlertTitle>
          <AlertDescription>
            <div className="mt-2 text-sm text-jd-mutedText">
              <p className="mb-2 font-medium">Admin Accounts:</p>
              <ul className="space-y-1 list-disc pl-5">
                <li>admin@water.com - Water Supply Admin</li>
                <li>admin@electricity.com - Electricity Admin</li>
                <li>admin@health.com - Health Admin</li>
                <li>admin@education.com - Education Admin</li>
                <li>admin@sanitation.com - Sanitation Admin</li>
                <li>admin@publicworks.com - Public Works Admin</li>
                <li>admin@transport.com - Transportation Admin</li>
                <li>admin@urban.com - Urban Development Admin</li>
                <li>admin@environment.com - Environment Admin</li>
                <li>admin@finance.com - Finance Admin</li>
              </ul>
              <p className="mt-3 mb-2 font-medium">Client Account:</p>
              <ul className="space-y-1 list-disc pl-5">
                <li>client@jdframeworks.com - Regular Client</li>
              </ul>
              <p className="mt-3 text-xs italic">
                Any password will work for demo purposes.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DemoCredentials;
