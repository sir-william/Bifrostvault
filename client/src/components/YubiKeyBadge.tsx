import { Badge } from "@/components/ui/badge";
import { Fingerprint, Key, Shield } from "lucide-react";

interface YubiKeyBadgeProps {
  keyType?: string;
  userVerified?: boolean;
  className?: string;
}

export function YubiKeyBadge({ keyType, userVerified, className }: YubiKeyBadgeProps) {
  const getBadgeInfo = () => {
    switch (keyType) {
      case 'bio':
        return {
          icon: <Fingerprint className="h-3 w-3 mr-1" />,
          text: 'YubiKey Bio',
          variant: 'default' as const,
          className: 'bg-blue-500/10 text-blue-500 border-blue-500/50',
        };
      case 'yubikey5':
        return {
          icon: <Shield className="h-3 w-3 mr-1" />,
          text: 'YubiKey 5',
          variant: 'secondary' as const,
          className: 'bg-green-500/10 text-green-500 border-green-500/50',
        };
      case 'securitykey':
        return {
          icon: <Key className="h-3 w-3 mr-1" />,
          text: 'Security Key',
          variant: 'outline' as const,
          className: 'bg-gray-500/10 text-gray-500 border-gray-500/50',
        };
      default:
        return {
          icon: <Key className="h-3 w-3 mr-1" />,
          text: 'YubiKey',
          variant: 'outline' as const,
          className: 'bg-gray-500/10 text-gray-500 border-gray-500/50',
        };
    }
  };

  const badgeInfo = getBadgeInfo();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant={badgeInfo.variant} className={badgeInfo.className}>
        {badgeInfo.icon}
        {badgeInfo.text}
      </Badge>
      {userVerified && keyType === 'bio' && (
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/50">
          <Fingerprint className="h-3 w-3 mr-1" />
          Biometric
        </Badge>
      )}
    </div>
  );
}

interface KeyTypeDescriptionProps {
  keyType?: string;
}

export function KeyTypeDescription({ keyType }: KeyTypeDescriptionProps) {
  const getDescription = () => {
    switch (keyType) {
      case 'bio':
        return {
          title: 'YubiKey Bio Series',
          description: 'Hardware security key with fingerprint authentication. Uses biometric verification for passwordless login.',
          features: [
            'Fingerprint sensor for touch-to-authenticate',
            'PIN fallback after 3 failed attempts',
            'Supports up to 25 discoverable credentials',
            'FIDO2/WebAuthn certified',
          ],
        };
      case 'yubikey5':
        return {
          title: 'YubiKey 5 Series',
          description: 'Multi-protocol hardware security key supporting FIDO2, U2F, PIV, and more.',
          features: [
            'Touch-based authentication',
            'Supports multiple protocols',
            'Supports up to 100 discoverable credentials',
            'FIDO2/WebAuthn certified',
          ],
        };
      case 'securitykey':
        return {
          title: 'Security Key Series',
          description: 'FIDO2-focused security key for passwordless and two-factor authentication.',
          features: [
            'Touch-based authentication',
            'FIDO2/WebAuthn and U2F support',
            'Compact and affordable',
            'NFC support (on NFC models)',
          ],
        };
      default:
        return {
          title: 'Hardware Security Key',
          description: 'FIDO2-compatible hardware authentication device.',
          features: [
            'Touch-based authentication',
            'FIDO2/WebAuthn support',
            'Phishing-resistant security',
          ],
        };
    }
  };

  const info = getDescription();

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm">{info.title}</h4>
      <p className="text-sm text-muted-foreground">{info.description}</p>
      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
        {info.features.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>
    </div>
  );
}
