import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ForgotPasswordForm } from "@/components/features/auth/forgot-password-form";

// Mock next-intl
jest.mock("next-intl", () => ({
    useTranslations: () => (key: string) => {
        const translations: Record<string, string> = {
            "auth.forgotPassword": "Forgot password?",
            "auth.forgotPasswordDescription": "Enter your email",
            "auth.email": "Email",
            "auth.sendResetEmail": "Send reset email",
            "auth.checkEmail": "Check your email",
            "auth.resetEmailSent": "We've sent you an email",
            "auth.backToSignIn": "Back to sign in",
        };
        return translations[key] || key;
    },
}));

// Mock Supabase client
const mockResetPasswordForEmail = jest.fn();
jest.mock("@/components/features/providers/supabase-session-provider", () => ({
    useSupabaseClient: () => ({
        auth: {
            resetPasswordForEmail: mockResetPasswordForEmail,
        },
    }),
}));

describe("ForgotPasswordForm", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders forgot password form", () => {
        render(<ForgotPasswordForm />);
        expect(screen.getByRole("heading", { name: /forgot password/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /send reset email/i })).toBeInTheDocument();
    });

    it("shows error for invalid email", async () => {
        const user = userEvent.setup();
        render(<ForgotPasswordForm />);

        const emailInput = screen.getByLabelText(/email/i);
        const submitButton = screen.getByRole("button", { name: /send reset email/i });

        await user.type(emailInput, "invalid-email");
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
        });

        expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
    });

    it("sends reset email successfully", async () => {
        const user = userEvent.setup();
        mockResetPasswordForEmail.mockResolvedValue({ error: null });

        render(<ForgotPasswordForm />);

        const emailInput = screen.getByLabelText(/email/i);
        const submitButton = screen.getByRole("button", { name: /send reset email/i });

        await user.type(emailInput, "user@example.com");
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
                "user@example.com",
                expect.objectContaining({
                    redirectTo: expect.stringContaining("/reset-password"),
                })
            );
        });

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: /check your email/i })).toBeInTheDocument();
        });
    });

    it("shows error from Supabase", async () => {
        const user = userEvent.setup();
        const errorMessage = "Email not found";
        mockResetPasswordForEmail.mockResolvedValue({ error: { message: errorMessage } });

        render(<ForgotPasswordForm />);

        const emailInput = screen.getByLabelText(/email/i);
        const submitButton = screen.getByRole("button", { name: /send reset email/i });

        await user.type(emailInput, "user@example.com");
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });

    it("disables form during submission", async () => {
        const user = userEvent.setup();
        mockResetPasswordForEmail.mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
        );

        render(<ForgotPasswordForm />);

        const emailInput = screen.getByLabelText(/email/i);
        const submitButton = screen.getByRole("button", { name: /send reset email/i });

        await user.type(emailInput, "user@example.com");
        await user.click(submitButton);

        expect(submitButton).toBeDisabled();
        expect(emailInput).toBeDisabled();
    });
});
