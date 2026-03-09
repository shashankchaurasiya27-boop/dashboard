import { useState } from "react";
import { 
  User, 
  Bell, 
  Cpu, 
  Shield, 
  Save, 
  Key,
  Database,
  Link as LinkIcon
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";

export function Settings() {
  const [confidence, setConfidence] = useState([85]);
  const [riskLimit, setRiskLimit] = useState([60]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Settings & Preferences</h1>
        <p className="text-slate-400 mt-1">Manage your account, AI configuration, and system integrations.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-slate-800 p-1 w-full justify-start h-auto flex-wrap">
          <TabsTrigger value="profile" className="data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-400 text-slate-400 rounded-md px-4 py-2 flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="ai-engine" className="data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-400 text-slate-400 rounded-md px-4 py-2 flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            AI Engine
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-400 text-slate-400 rounded-md px-4 py-2 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-400 text-slate-400 rounded-md px-4 py-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security & API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl text-slate-100">Personal Information</CardTitle>
              <CardDescription className="text-slate-400">Update your account details and public profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center shrink-0 shadow-inner">
                  <span className="text-2xl font-bold text-slate-300">JD</span>
                </div>
                <div>
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                    Change Avatar
                  </Button>
                  <p className="text-xs text-slate-500 mt-2">JPG, GIF or PNG. 1MB max.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-300">First Name</Label>
                  <Input id="firstName" defaultValue="Jane" className="bg-slate-900 border-slate-700 text-slate-200 focus-visible:ring-indigo-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-300">Last Name</Label>
                  <Input id="lastName" defaultValue="Doe" className="bg-slate-900 border-slate-700 text-slate-200 focus-visible:ring-indigo-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                  <Input id="email" type="email" defaultValue="jane.doe@intellicredit.ai" className="bg-slate-900 border-slate-700 text-slate-200 focus-visible:ring-indigo-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-slate-300">Role</Label>
                  <Input id="role" defaultValue="Senior Credit Risk Analyst" disabled className="bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-slate-700/50 pt-6">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="ai-engine" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl text-slate-100">AI Processing Rules</CardTitle>
              <CardDescription className="text-slate-400">Configure how the AI evaluates applications and sets thresholds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Label className="text-base text-slate-200">Auto-Approval Confidence Threshold</Label>
                    <p className="text-sm text-slate-400">Minimum AI confidence required to suggest an automatic approval.</p>
                  </div>
                  <span className="text-xl font-bold text-indigo-400">{confidence[0]}%</span>
                </div>
                <Slider 
                  defaultValue={[85]} 
                  max={100} 
                  step={1} 
                  value={confidence}
                  onValueChange={setConfidence}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>More manual reviews (0%)</span>
                  <span>Fully automated (100%)</span>
                </div>
              </div>

              <div className="w-full h-px bg-slate-700/50"></div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Label className="text-base text-slate-200">Maximum Acceptable Risk Score</Label>
                    <p className="text-sm text-slate-400">Applications above this score will be auto-rejected.</p>
                  </div>
                  <span className="text-xl font-bold text-rose-400">{riskLimit[0]}</span>
                </div>
                <Slider 
                  defaultValue={[60]} 
                  max={100} 
                  step={1} 
                  value={riskLimit}
                  onValueChange={setRiskLimit}
                  className="py-4"
                />
              </div>

              <div className="w-full h-px bg-slate-700/50"></div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base text-slate-200">Strict Data Extraction</Label>
                    <p className="text-sm text-slate-400">Flag human review if a document is missing any requested data fields.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base text-slate-200">Enable Sentiment Analysis</Label>
                    <p className="text-sm text-slate-400">Analyze qualitative footnotes in financial reports.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-slate-700/50 pt-6">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <Save className="w-4 h-4" />
                Update AI Rules
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl text-slate-100">Alerts & Notifications</CardTitle>
              <CardDescription className="text-slate-400">Choose what events trigger an alert and how you receive them.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider">Email Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                    <div>
                      <p className="font-medium text-slate-200">New High-Risk Drafts</p>
                      <p className="text-sm text-slate-400">Get an email when a new draft enters critical risk territory.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                    <div>
                      <p className="font-medium text-slate-200">Weekly Portfolio Summary</p>
                      <p className="text-sm text-slate-400">A digest of the week's approvals and overall risk exposure.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                    <div>
                      <p className="font-medium text-slate-200">System Errors & Updates</p>
                      <p className="text-sm text-slate-400">Receive administrative notices.</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl text-slate-100">API Keys & Access</CardTitle>
              <CardDescription className="text-slate-400">Manage connections to external data providers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-slate-900/80 border border-amber-900/50 rounded-lg p-4 flex items-start gap-4">
                <Key className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-500">Protect your keys</h4>
                  <p className="text-sm text-slate-400 mt-1">
                    API keys provide full access to your organization's evaluation environment. Never share them in public repositories.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Database className="w-4 h-4 text-slate-500" />
                    External CRM Integrations Key
                  </Label>
                  <div className="flex space-x-2">
                    <Input readOnly value="sk_test_51NxXXXXXXXXXXXXXXXXXXXXXXXXXXX" className="bg-slate-900 border-slate-700 text-slate-400 font-mono text-sm" />
                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">Copy</Button>
                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">Revoke</Button>
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-slate-700/50"></div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-300">Connected Services</h3>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 border border-slate-700 rounded-lg bg-slate-800/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-indigo-500/20 flex items-center justify-center">
                        <LinkIcon className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">Salesforce Integration</p>
                        <p className="text-xs text-slate-500">Syncs approved limits daily.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">Configure</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
