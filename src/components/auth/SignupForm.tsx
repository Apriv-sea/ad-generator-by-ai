
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { AtSign, Lock, UserPlus } from "lucide-react";

// Schema de validation pour l'inscription avec sécurité renforcée
const signupSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string()
    .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
      message: "Le mot de passe doit contenir au moins: 1 minuscule, 1 majuscule, 1 chiffre et 1 caractère spécial"
    }),
  confirmPassword: z.string().min(1, { message: "La confirmation du mot de passe est requise" })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

interface SignupFormProps {
  setActiveTab: (tab: string) => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ setActiveTab }) => {
  const { signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: ""
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    try {
      setIsLoading(true);
      await signup(values.email, values.password);
      setActiveTab("login");
      toast.success("Compte créé avec succès! Veuillez vérifier votre email.");
    } catch (error: any) {
      console.error("Erreur d'inscription:", error);
      toast.error(error.message || "Erreur d'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
              <FormLabel className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Mot de passe
              </FormLabel>
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
        
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Confirmer le mot de passe
              </FormLabel>
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
          className="w-full flex gap-2 items-center justify-center" 
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Inscription...
            </span>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              S'inscrire
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default SignupForm;
