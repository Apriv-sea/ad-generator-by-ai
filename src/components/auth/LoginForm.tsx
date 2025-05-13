
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, AtSign } from "lucide-react";
import { Link } from "react-router-dom";

// Schema de validation pour le login
const loginSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(1, { message: "Le mot de passe est requis" })
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const { login, emailLogin } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailAuthLoading, setIsEmailAuthLoading] = useState(false);
  const [email, setEmail] = useState("");
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      await login(values.email, values.password);
      toast.success("Connexion réussie");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      toast.error(error.message || "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    try {
      setIsEmailAuthLoading(true);
      // Utilisez l'email du formulaire si disponible
      const emailToUse = form.getValues().email || email;
      await emailLogin(emailToUse);
    } catch (error) {
      console.error("Erreur d'authentification par email:", error);
    } finally {
      setIsEmailAuthLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <AtSign className="h-4 w-4" />
                  Email
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="votre@email.com" 
                    {...field} 
                    className="bg-white"
                    onChange={(e) => {
                      field.onChange(e);
                      handleEmailChange(e);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Mot de passe
                  </FormLabel>
                  <Link to="#" className="text-xs text-primary hover:underline">
                    Mot de passe oublié?
                  </Link>
                </div>
                <FormControl>
                  <Input 
                    type="password" 
                    {...field} 
                    className="bg-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Connexion...
              </span>
            ) : "Se connecter"}
          </Button>
        </form>
      </Form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground">
            Ou continuer avec
          </span>
        </div>
      </div>
      
      <Button 
        type="button" 
        variant="outline" 
        onClick={handleEmailAuth}
        disabled={isEmailAuthLoading} 
        className="w-full flex gap-2 items-center justify-center"
      >
        <Mail className="h-4 w-4" />
        {isEmailAuthLoading ? "Envoi en cours..." : "Connexion par lien magique"}
      </Button>
    </div>
  );
};

export default LoginForm;
