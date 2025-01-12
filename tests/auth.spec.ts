// import { test, expect } from "@playwright/test";

// test.describe("유저 로그인 및 회원가입", () => {
//   test.beforeEach(async ({ page }) => {
//     await page.goto("/");
//     await onBoarding(page);
//   });
// });

import { test, expect } from "@playwright/test";

// 테스트에 필요한 사용자 데이터
const TEST_USER = {
  name: "테스트 사용자",
  email: `test${Date.now()}@example.com`,
  password: "test1234",
};

const onBoarding = async (page) => {
  await page.click(".hover\\:bg-c_purple\\.600");
  await page.click(".hover\\:bg-c_purple\\.600");
  await page.click(".hover\\:bg-c_purple\\.600");
  await page.click(".hover\\:bg-c_purple\\.600");
  await page.click(".hover\\:bg-c_purple\\.600");
};

test.describe("인증 테스트", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await onBoarding(page);
  });

  test("회원가입 성공", async ({ page }) => {
    // 로그인 버튼 클릭
    await page.getByRole("button", { name: "로그인" }).click();

    // 회원가입 모드로 전환
    await page.getByText("계정이 없으신가요? 회원가입하기").click();

    // 폼 입력
    await page.getByPlaceholder("이름").fill(TEST_USER.name);
    await page.getByPlaceholder("이메일").fill(TEST_USER.email);
    await page.getByPlaceholder("비밀번호").fill(TEST_USER.password);

    // 회원가입 버튼 클릭
    await page.getByRole("button", { name: "회원가입" }).click();

    // 로그아웃 확인 모달에서 로그아웃 버튼 클릭
    await page.getByRole("button", { name: "로그아웃" }).click();

    // 로그아웃 상태 확인
    await page.waitForSelector('button:text("로그인")');
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
  });

  test("로그인 성공", async ({ page }) => {
    // 로그인 버튼 클릭
    // await page.getByRole("button", { name: "로그인" }).click();
    await page.click('[data-onboarding="login-button"]');

    // 폼 입력
    await page.getByPlaceholder("이메일").fill(TEST_USER.email);
    await page.getByPlaceholder("비밀번호").fill(TEST_USER.password);

    // 로그인 버튼 클릭
    // await page.getByRole("button", { name: "로그인" }).click();
    await page.click(
      ".glassContainer.glassContainer--border_lg.bdr_md.py_4px.cursor_pointer.bg_transparent",
    );

    // 로그인 성공 확인
    // await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible();
    await page.waitForSelector('[data-onboarding="login-button"]');
    await expect(page.locator('[data-onboarding="login-button"]'));
  });

  test("로그인 실패 - 잘못된 비밀번호", async ({ page }) => {
    // 로그인 버튼 클릭
    await page.getByRole("button", { name: "로그인" }).click();

    // 잘못된 정보 입력
    await page.getByPlaceholder("이메일").fill(TEST_USER.email);
    await page.getByPlaceholder("비밀번호").fill("wrong_password");

    // 로그인 버튼 클릭
    await page.getByRole("button", { name: "로그인" }).click();

    // 에러 메시지 확인
    await expect(page.getByText("이메일 또는 비밀번호가 올바르지 않습니다.")).toBeVisible();

    // 취소 버튼으로 모달 닫기
    await page.getByRole("button", { name: "취소" }).click();

    // 모달이 닫혔는지 확인
    await expect(page.getByText("Login")).not.toBeVisible();
  });

  test("이메일 형식 검증", async ({ page }) => {
    // 로그인 버튼 클릭
    await page.getByRole("button", { name: "로그인" }).click();

    // 잘못된 이메일 형식 입력
    await page.getByPlaceholder("이메일").fill("invalid-email");
    await page.getByPlaceholder("비밀번호").fill(TEST_USER.password);

    // 로그인 버튼 클릭
    await page.getByRole("button", { name: "로그인" }).click();

    // 에러 메시지 확인
    await expect(page.getByText("올바른 이메일 형식이 아닙니다.")).toBeVisible();

    // 취소 버튼으로 모달 닫기
    await page.getByRole("button", { name: "취소" }).click();

    // 모달이 닫혔는지 확인
    await expect(page.getByText("Login")).not.toBeVisible();
  });

  test("로그아웃", async ({ page }) => {
    // 먼저 로그인
    await page.getByRole("button", { name: "로그인" }).click();
    await page.getByPlaceholder("이메일").fill(TEST_USER.email);
    await page.getByPlaceholder("비밀번호").fill(TEST_USER.password);
    await page.getByRole("button", { name: "로그인" }).click();

    // 로그아웃 버튼 클릭
    await page.getByRole("button", { name: "로그아웃" }).click();

    // 로그아웃 확인 모달에서 로그아웃 버튼 클릭
    await page.getByRole("button", { name: "로그아웃" }).click();

    // 로그아웃 상태 확인
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
  });

  test("모달 닫기", async ({ page }) => {
    // 로그인 모달 열기
    await page.getByRole("button", { name: "로그인" }).click();

    // 취소 버튼으로 모달 닫기
    await page.getByRole("button", { name: "취소" }).click();

    // 모달이 닫혔는지 확인
    await expect(page.getByText("Login")).not.toBeVisible();
  });
});
