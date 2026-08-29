"use client";

import type { ReactElement } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const welcomeProfileSchema = z.object({
	name: z.string().max(32, "Please enter a name less than 32 characters."),
});

type WelcomeProfileFormData = z.infer<typeof welcomeProfileSchema>;

export default function WelcomeNameForm(): ReactElement {
	const router = useRouter();
	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<WelcomeProfileFormData>({
		resolver: zodResolver(welcomeProfileSchema),
		defaultValues: {
			name: "",
		},
	});

	const onSubmit = handleSubmit(async (values) => {
		const trimmedName = values.name.trim();
		const nameValue = trimmedName.length === 0 ? "Legend" : trimmedName;

		const { error } = await authClient.updateUser({ name: nameValue });
		if (error) {
			setError("name", {
				type: "server",
				message: "Could not save your name. Please try again.",
			});
			return;
		}
		router.replace("/");
	});

	return (
		<form
			onSubmit={onSubmit}
			className="mt-1 flex w-full max-w-xs flex-col gap-1">
			<p className="mt-2 text-sm">Add your name to continue.</p>
			<Input
				type="text"
				{...register("name")}
				placeholder="Legend"
				disabled={isSubmitting}
			/>
			{errors.name?.message ? (
				<p className="text-sm text-destructive">{errors.name.message}</p>
			) : null}
			<Button
				type="submit"
				disabled={isSubmitting}
				className="mt-8">
				{isSubmitting ? "Saving..." : "Continue"}
			</Button>
		</form>
	);
}
