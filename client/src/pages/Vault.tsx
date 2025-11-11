import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { KeyRound, Plus, Search, Star, LogOut, Settings, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Vault() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: vaultEntries, isLoading: entriesLoading } = trpc.vault.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: credentials } = trpc.webauthn.listCredentials.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasYubiKey = credentials && credentials.length > 0;
  const filteredEntries = vaultEntries?.filter(entry =>
    searchQuery === "" || 
    entry.encryptedName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KeyRound className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.name || user?.email}</span>
            <Button variant="ghost" size="icon" onClick={() => setLocation("/setup-yubikey")}>
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* YubiKey Warning */}
        {!hasYubiKey && (
          <Card className="mb-6 border-yellow-500/50 bg-yellow-500/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-yellow-500" />
                <div>
                  <CardTitle className="text-yellow-500">YubiKey Not Configured</CardTitle>
                  <CardDescription>
                    For enhanced security, please set up your YubiKey for hardware authentication.
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  className="ml-auto"
                  onClick={() => setLocation("/setup-yubikey")}
                >
                  Setup YubiKey
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Search and Actions */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vault..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => toast.info("Add entry feature coming soon")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>

        {/* Vault Entries */}
        {entriesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredEntries && filteredEntries.length > 0 ? (
          <div className="grid gap-4">
            {filteredEntries.map((entry) => (
              <Card key={entry.id} className="vault-card cursor-pointer hover:bg-accent/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <KeyRound className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{entry.encryptedName}</CardTitle>
                        <CardDescription className="text-sm">
                          {entry.type === 'login' ? 'Login' : entry.type}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="py-12">
            <CardContent className="text-center">
              <KeyRound className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Your vault is empty</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first password or secure note.
              </p>
              <Button onClick={() => toast.info("Add entry feature coming soon")}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Entry
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
