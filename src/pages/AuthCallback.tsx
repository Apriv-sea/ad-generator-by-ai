
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuthCallbackProcessor } from "@/hooks/useAuthCallbackProcessor";
import GoogleCallbackContent from "@/components/auth/GoogleCallbackContent";
import AuthCallbackContent from "@/components/auth/AuthCallbackContent";
import { extractUrlErrors } from "@/utils/authCallbackUtils";

const AuthCallback: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    status,
    statusMessage,
    errorDetails,
    processStandardAuth,
    processGoogleSheetsAuth,
    checkForErrors,
    redirectToRoot,
    goBack
  } = useAuthCallbackProcessor();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // First check for errors in URL parameters
        const { hasError, errorMessage } = extractUrlErrors();
        if (hasError && errorMessage) {
          setIsProcessing(false);
          return;
        }

        // Check if it's a Google Sheets callback
        const isGoogleSheetsCallback = location.pathname.includes('/google');
        
        if (isGoogleSheetsCallback) {
          // Process Google Sheets authentication
          const success = processGoogleSheetsAuth();
          
          if (success) {
            // Redirect to previous page after a short delay
            setTimeout(() => {
              navigate(-1);
            }, 1500);
          }
        } else {
          // Process standard app authentication
          const success = await processStandardAuth();
          
          if (success) {
            // Redirect to dashboard after a short delay
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          }
        }
        
        setIsProcessing(false);
      } catch (error: any) {
        console.error("Erreur lors du traitement du callback:", error);
        toast.error("Erreur lors du traitement de l'authentification");
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [navigate, location, processStandardAuth, processGoogleSheetsAuth]);

  // Determine if we're handling a Google Sheets callback
  const isGoogleCallback = location.pathname.includes('/google');
  
  // Check if token is found in URL
  const isTokenFound = location.hash.includes('access_token') || 
                      location.search.includes('access_token');

  return (
    <>
      {isGoogleCallback ? (
        <GoogleCallbackContent 
          status={{ type: status, message: statusMessage }}
          errorDetails={errorDetails}
          goBack={goBack}
        />
      ) : (
        <AuthCallbackContent
          status={{ type: status, message: statusMessage }}
          errorDetails={errorDetails}
          isTokenFound={isTokenFound}
          manualRedirectToRoot={redirectToRoot}
          isProcessing={isProcessing}
        />
      )}
    </>
  );
};

export default AuthCallback;
