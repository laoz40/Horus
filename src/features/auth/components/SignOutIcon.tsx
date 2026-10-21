import { IconLoader2, IconLogout } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export default function SignOutIcon({
	isSigningOut,
	className,
}: {
	isSigningOut: boolean;
	className: string;
}) {
	if (isSigningOut) {
		return <IconLoader2 className={cn(className, "animate-spin")} />;
	}

	return <IconLogout className={className} />;
}
