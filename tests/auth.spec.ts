import { test, expect, Page } from "@playwright/test";

// 테스트에 필요한 사용자 데이터
const TEST_USER = {
  name: "테스트 사용자",
  email: "q@q.q",
  password: "q",
};

const onBoarding = async (page: Page) => {
  await page.click(".hover\\:bg-c_purple\\.600");
  await page.click(".hover\\:bg-c_purple\\.600");
  await page.click(".hover\\:bg-c_purple\\.600");
  await page.click(".hover\\:bg-c_purple\\.600");
  await page.click(".hover\\:bg-c_purple\\.600");
};

test.describe("인증 테스트", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addInitScript(() => {
      window.sessionStorage.setItem("hasVisitedBefore", "true");
    });
    await page.goto("/");
    await onBoarding(page);
  });

  test.describe("회원가입", () => {
    test("회원가입 성공", async ({ page }) => {
      // 로그인 버튼 클릭
      // await page.getByRole("button", { name: "로그인" }).click();
      await page.getByTestId("sidebarLoginButton").click();

      // 회원가입 모드로 전환
      // await page.getByText("계정이 없으신가요? 회원가입하기").click();
      await page.getByTestId("toSignUpButton").click();

      // 폼 입력
      await page.getByPlaceholder("이름").fill(TEST_USER.name);
      await page.getByPlaceholder("이메일").fill(TEST_USER.email);
      await page.getByPlaceholder("비밀번호").fill(TEST_USER.password);

      // 회원가입 버튼 클릭
      // await page.getByRole("button", { name: "회원가입" }).click();
      await page.getByTestId("modalPrimaryButton").click();

      // 로그아웃 확인 모달에서 로그아웃 버튼 클릭
      // await page.getByRole("button", { name: "로그아웃" }).click();
      await page.getByTestId("modalPrimaryButton").click();

      // 로그아웃 상태 확인
      await expect(page.getByTestId("sidebarLoginButton")).toBeVisible();
    });

    test("회원가입 실패 - 사용중인 이메일", async ({ page }) => {
      // 동일한 이메일로 다시 회원가입
      await page.getByTestId("sidebarLoginButton").click();
      await page.getByTestId("toSignUpButton").click();

      // 이미 존재하는 이메일로 가입 시도
      await page.getByPlaceholder("이름").fill(TEST_USER.name);
      await page.getByPlaceholder("이메일").fill(TEST_USER.email);
      await page.getByPlaceholder("비밀번호").fill(TEST_USER.password);

      await Promise.all([
        page.waitForResponse(
          (response) => response.url().includes("/auth/register") && response.status() === 409,
        ),
        page.getByTestId("modalPrimaryButton").click(),
      ]);

      // 에러 메시지 확인
      await expect(page.getByTestId("authErrorMessage")).toHaveText("이미 사용 중인 이메일입니다.");
    });

    test("회원가입 실패 - 유효성 검사", async ({ page }) => {
      await page.getByTestId("sidebarLoginButton").click();
      await page.getByTestId("toSignUpButton").click();

      // 1. 이름 누락
      await page.getByPlaceholder("이메일").fill(TEST_USER.email);
      await page.getByPlaceholder("비밀번호").fill(TEST_USER.password);
      await page.getByTestId("modalPrimaryButton").click();
      await expect(page.getByTestId("authErrorMessage")).toHaveText("이름을 입력해주세요.");

      // 2. 잘못된 이메일 형식
      await page.getByPlaceholder("이름").fill(TEST_USER.name);
      await page.getByPlaceholder("이메일").fill("invalid-email");
      await page.getByTestId("modalPrimaryButton").click();
      await expect(page.getByTestId("authErrorMessage")).toHaveText(
        "올바른 이메일 형식이 아닙니다.",
      );

      // 3. 비밀번호 누락
      await page.getByPlaceholder("이메일").clear();
      await page.getByPlaceholder("이메일").fill(TEST_USER.email);
      await page.getByPlaceholder("비밀번호").clear();
      await page.getByTestId("modalPrimaryButton").click();
      await expect(page.getByTestId("authErrorMessage")).toHaveText("비밀번호를 입력해주세요.");
    });

    test("회원가입 취소", async ({ page }) => {
      await page.getByTestId("sidebarLoginButton").click();
      await page.getByTestId("toSignUpButton").click();

      // 일부 정보 입력 후 취소
      await page.getByPlaceholder("이름").fill(TEST_USER.name);
      await page.getByPlaceholder("이메일").fill(TEST_USER.email);

      // 취소 버튼 클릭
      await page.getByTestId("modalSecondaryButton").click();

      // 모달이 닫혔는지 확인
      await expect(page.getByTestId("modalPrimaryButton")).not.toBeVisible();

      // 다시 모달을 열었을 때 입력 필드가 비어있는지 확인
      await page.getByTestId("sidebarLoginButton").click();
      await page.getByTestId("toSignUpButton").click();

      await expect(page.getByPlaceholder("이름")).toHaveValue("");
      await expect(page.getByPlaceholder("이메일")).toHaveValue("");
      await expect(page.getByPlaceholder("비밀번호")).toHaveValue("");
    });
  });

  test.describe("로그인", () => {
    test("로그인 성공", async ({ page }) => {
      await page.getByTestId("sidebarLoginButton").click();

      await page.getByPlaceholder("이메일").fill(TEST_USER.email);
      await page.getByPlaceholder("비밀번호").fill(TEST_USER.password);

      // 로그인 API 요청과 버튼 클릭을 동시에 대기
      await Promise.all([
        page.waitForResponse((response) => response.url().includes("login"), { timeout: 30000 }),
        page.getByTestId("modalPrimaryButton").click(),
      ]);

      // 모달이 닫혔는지 확인
      await expect(page.getByTestId("modalPrimaryButton")).not.toBeVisible();

      // 로그인 성공으로 UI가 변경되었는지 확인
      await expect(page.getByTestId("sidebarLogoutButton")).toBeVisible();
      // 로그인 버튼이 사라졌는지 확인
      await expect(page.getByTestId("sidebarLoginButton")).not.toBeVisible();
    });

    test("로그인 실패 - 잘못된 비밀번호", async ({ page }) => {
      // 로그인 버튼 클릭
      await page.getByTestId("sidebarLoginButton").click();

      // 잘못된 정보 입력
      await page.getByPlaceholder("이메일").fill(TEST_USER.email);
      await page.getByPlaceholder("비밀번호").fill("wrong_password");

      // 로그인 버튼 클릭
      // API 응답과 버튼 클릭을 동시에 대기
      await Promise.all([
        // 401 응답을 기다림
        page.waitForResponse(
          (response) => response.url().includes("/auth/login") && response.status() === 401,
        ),
        page.waitForTimeout(2000),
        // 로그인 버튼 클릭
        page.getByTestId("modalPrimaryButton").click(),
      ]);

      // 상태 업데이트를 위한 짧은 대기 추가
      await page.waitForTimeout(2000);

      // 에러 메시지 확인
      await expect(page.getByTestId("authErrorMessage")).toHaveText(
        "이메일 또는 비밀번호가 올바르지 않습니다.",
      );
    });

    test("로그인 실패 - 이메일 형식 검증", async ({ page }) => {
      // 로그인 버튼 클릭
      await page.getByTestId("sidebarLoginButton").click();

      // 잘못된 이메일 형식 입력
      await page.getByPlaceholder("이메일").fill("invalid-email");
      await page.getByPlaceholder("비밀번호").fill(TEST_USER.password);

      await page.getByTestId("modalPrimaryButton").click();

      // 에러 메시지 확인
      await expect(page.getByTestId("authErrorMessage")).toHaveText(
        "올바른 이메일 형식이 아닙니다.",
      );

      // 취소 버튼으로 모달 닫기
      await page.getByTestId("modalSecondaryButton").click();

      // 모달이 닫혔는지 확인
      await expect(page.getByTestId("modalPrimaryButton")).not.toBeVisible();
    });

    test("로그인 취소", async ({ page }) => {
      await page.getByTestId("sidebarLoginButton").click();

      // 일부 정보 입력 후 취소
      await page.getByPlaceholder("이메일").fill(TEST_USER.name);
      await page.getByPlaceholder("비밀번호").fill(TEST_USER.email);

      // 취소 버튼 클릭
      await page.getByTestId("modalSecondaryButton").click();

      // 모달이 닫혔는지 확인
      await expect(page.getByTestId("modalPrimaryButton")).not.toBeVisible();

      // 다시 모달을 열었을 때 입력 필드가 비어있는지 확인
      await page.getByTestId("sidebarLoginButton").click();

      await expect(page.getByPlaceholder("이메일")).toHaveValue("");
      await expect(page.getByPlaceholder("비밀번호")).toHaveValue("");
    });

    test("로그아웃", async ({ page }) => {
      // 먼저 로그인
      await page.getByTestId("sidebarLoginButton").click();
      await page.getByPlaceholder("이메일").fill(TEST_USER.email);
      await page.getByPlaceholder("비밀번호").fill(TEST_USER.password);
      await page.getByTestId("modalPrimaryButton").click();

      // 로그아웃 버튼 클릭
      await page.getByTestId("sidebarLogoutButton").click();

      // 로그아웃 확인 모달에서 로그아웃 버튼 클릭
      await page.getByTestId("modalPrimaryButton").click();

      // 로그아웃 상태 확인
      await expect(page.getByTestId("sidebarLoginButton")).toBeVisible();
    });
  });

  test("모달 닫기", async ({ page }) => {
    // 로그인 모달 열기
    await page.getByTestId("sidebarLoginButton").click();

    // 취소 버튼으로 모달 닫기
    await page.getByTestId("modalSecondaryButton").click();

    // 모달이 닫혔는지 확인
    await expect(page.getByTestId("modalPrimaryButton")).not.toBeVisible();
  });
});
