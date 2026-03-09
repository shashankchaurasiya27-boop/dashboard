import { useState } from "react";
import { useNavigate } from "react-router";
import { LogIn, Loader2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { api } from "../../lib/api";
import { toast } from "sonner";

export function LoginPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) return;

        setLoading(true);
        try {
            await api.manualLogin(username, password);
            toast.success("Login successful");
            navigate("/");
        } catch (error) {
            toast.error("Invalid username or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-8 text-indigo-500">
                    <ShieldCheck className="h-12 w-12" />
                </div>

                <Card className="border-slate-800 bg-slate-900 shadow-2xl">
                    <CardHeader className="space-y-1 text-center pb-6">
                        <CardTitle className="text-2xl font-bold tracking-tight text-white">Sign in to Intelli-Credit</CardTitle>
                        <CardDescription className="text-slate-400">
                            Enter your credentials to access the analyst portal
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-slate-300">Username</Label>
                                <Input
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="admin or analyst"
                                    className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-slate-300">Password</Label>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-slate-950 border-slate-700 text-white focus-visible:ring-indigo-500"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <LogIn className="mr-2 h-4 w-4" />
                                )}
                                Sign in
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm text-slate-500 border-t border-slate-800 pt-6 space-y-2 flex flex-col items-center">
                            <p>Demo Credentials:</p>
                            <div className="flex gap-4">
                                <div className="bg-slate-800 px-3 py-1 rounded border border-slate-700">admin / Admin@1234</div>
                                <div className="bg-slate-800 px-3 py-1 rounded border border-slate-700">analyst / Analyst@1234</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
