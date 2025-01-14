import { test, expect, Page } from "@playwright/test";

const onBoarding = async (page: Page) => {
  await page.click(".hover\\:bg-c_purple\\.600");
  await page.click(".hover\\:bg-c_purple\\.600");
  await page.click(".hover\\:bg-c_purple\\.600");
  await page.click(".hover\\:bg-c_purple\\.600");
  await page.click(".hover\\:bg-c_purple\\.600");
};

test.describe.configure({ mode: "serial" });

test.describe("사이드바 테스트", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addInitScript(() => {
      window.sessionStorage.setItem("hasVisitedBefore", "true");
    });
    await page.goto("/");
    await onBoarding(page);
  });

  test("사이드바 토글", async ({ page }) => {
    await expect(page.getByTestId("sidebarToggle")).toBeVisible();
    await expect(page.getByTestId("sidebarToggle")).toBeEnabled();

    await page.getByTestId("sidebarToggle").click();
    await expect(page.getByTestId("sidebar")).toHaveCSS("width", "40px");

    await page.getByTestId("sidebarToggle").click();
    await expect(page.getByTestId("sidebar")).toHaveCSS("width", "300px");
  });
});

test.describe("사이드바 페이지 테스트", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addInitScript(() => {
      window.sessionStorage.setItem("hasVisitedBefore", "true");
    });
    await page.goto("/");
    await onBoarding(page);
  });

  test.afterEach(async ({ page }) => {
    const pageCount = await page.locator('[data-testid^="pageItem-"]').count();

    if (pageCount === 0) {
      return;
    }

    for (let i = pageCount - 1; i >= 0; i--) {
      // 먼저 페이지 아이템에 hover
      await page.getByTestId(`pageItem-${i}`).hover();
      await page.getByTestId(`pageDeleteButton-${i}`).waitFor({ state: "visible" });
      // 이제 삭제 버튼 클릭
      await page.getByTestId(`pageDeleteButton-${i}`).click();
      // 확인 모달의 확인 버튼 클릭
      await page.getByTestId("modalPrimaryButton").click();
      await expect(page.getByTestId(`pageItem-${i}`)).not.toBeVisible();
    }
  });

  test("페이지 추가", async ({ page }) => {
    // 초기 페이지 개수
    const initialPages = await page.locator('[data-testid^="pageItem-"]').count();
    await page.getByTestId("addPageButton").click();
    await page.waitForLoadState("networkidle");
    // 추가한 후 페이지 개수
    const newPages = await page.locator('[data-testid^="pageItem-"]').count();

    // 개수가 1 증가했는지 확인
    expect(newPages).toBe(initialPages + 1);

    // 사이드바에 페이지 있는지 확인
    await expect(page.getByTestId(`pageItem-${initialPages}`)).toBeVisible();
  });

  test("페이지 열기", async ({ page }) => {
    await page.getByTestId("addPageButton").click();
    await page.waitForLoadState("networkidle");
    const initialPages = await page.locator('[data-testid^="pageItem-"]').count();

    // 페이지 클릭
    await page.getByTestId(`pageItem-${+initialPages - 1}`).click();

    // 열린 페이지 확인
    const workspacePages = await page.locator('[data-testid^="page-"]').count();
    await expect(page.getByTestId(`page-${+workspacePages - 1}`)).toBeVisible();
  });

  test("페이지 삭제", async ({ page }) => {
    // 페이지 추가
    await page.getByTestId("addPageButton").click();
    await page.waitForLoadState("networkidle");
    // 초기 페이지 개수
    const initialPages = await page.locator('[data-testid^="pageItem-"]').count();

    // 삭제 버튼 hover
    await page.getByTestId(`pageItem-${+initialPages - 1}`).hover();
    await page.getByTestId(`pageDeleteButton-${+initialPages - 1}`).waitFor({ state: "visible" });

    // 페이지 삭제
    await page.getByTestId(`pageDeleteButton-${+initialPages - 1}`).click();

    await page.getByTestId("modalPrimaryButton").click();
    await page.waitForLoadState("networkidle");

    // 삭제 후 페이지 개수
    const newPages = await page.locator('[data-testid^="pageItem-"]').count();

    // 개수가 1 감소했는지 확인
    expect(newPages).toBe(initialPages - 1);
  });

  test("페이지 아이콘 변경", async ({ page }) => {
    // 페이지 추가
    await page.getByTestId("addPageButton").click();
    await page.waitForLoadState("networkidle");
    const targetIndex = (await page.locator('[data-testid^="pageItem-"]').count()) - 1;

    // 페이지 아이콘 클릭
    await page.locator(`[data-testid="pageIconButton-${targetIndex}-Docs"]`).click();

    // 아이콘 변경 모달 확인
    await expect(page.getByTestId("iconModal")).toBeVisible();

    // 아이콘 변경
    const icons = await page.locator('[data-testid^="iconModalButton-"]').all();
    for (const icon of icons) {
      const key = await icon.getAttribute("data-testid");
      const [, iconType] = key!.split("-");
      await icon.click();
      await expect(
        page.locator(`[data-testid="pageIconButton-${targetIndex}-${iconType}"]`),
      ).toBeVisible();
      await page.locator(`[data-testid="pageIconButton-${targetIndex}-${iconType}"]`).click();
    }
    await page.getByTestId("iconModalCloseButton").click();
    await expect(page.getByTestId("iconModal")).not.toBeVisible();
  });
});

test.describe("페이지 테스트", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addInitScript(() => {
      window.sessionStorage.setItem("hasVisitedBefore", "true");
    });
    await page.goto("/");
    await onBoarding(page);
    await page.getByTestId("addPageButton").click();
    await page.waitForLoadState("networkidle");
    // 페이지 열기
    const targetIndex = (await page.locator('[data-testid^="pageItem-"]').count()) - 1;
    await page.getByTestId(`pageItem-${targetIndex}`).click();
  });

  test.afterEach(async ({ page }) => {
    const pageCount = await page.locator('[data-testid^="pageItem-"]').count();

    if (pageCount === 0) {
      return;
    }

    for (let i = pageCount - 1; i >= 0; i--) {
      // 먼저 페이지 아이템에 hover
      await page.getByTestId(`pageItem-${i}`).hover();
      await page.getByTestId(`pageDeleteButton-${i}`).waitFor({ state: "visible" });
      // 이제 삭제 버튼 클릭
      await page.getByTestId(`pageDeleteButton-${i}`).click();
      // 확인 모달의 확인 버튼 클릭
      await page.getByTestId("modalPrimaryButton").click();
      await expect(page.getByTestId(`pageItem-${i}`)).not.toBeVisible();
    }
  });

  test("페이지 최소화", async ({ page }) => {
    const targetIndex = (await page.locator('[data-testid^="page-"]').count()) - 1;
    await page.getByTestId(`pageMinimizeButton-${targetIndex}`).click();
    await expect(page.getByTestId(`page-${targetIndex}`)).toHaveCSS("width", "300px");
    await expect(page.getByTestId(`page-${targetIndex}`)).toHaveCSS("height", "200px");
  });

  test("페이지 최대화", async ({ page }) => {
    const targetIndex = (await page.locator('[data-testid^="page-"]').count()) - 1;

    // 초기 위치와 크기 저장
    const initialSize = await page.getByTestId(`page-${targetIndex}`).evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        width: style.width,
        height: style.height,
      };
    });

    // 최대화 버튼 클릭
    await page.getByTestId(`pageMaximizeButton-${targetIndex}`).click();

    // 창 크기에 맞게 최대화되었는지 확인
    const maximizedSize = await page.getByTestId(`page-${targetIndex}`).evaluate(() => {
      const sidebarWidth = document.querySelector('[data-testid="sidebar"]')?.clientWidth || 0;
      const padding = 40; // PADDING 상수값
      console.log({
        windowWidth: window.innerWidth,
        sidebarWidth,
        padding,
        calculatedWidth: window.innerWidth - sidebarWidth - padding,
      });
      // 2를 빼야함
      // glassContainer에 border가 있어서 1px + 1px 총 2px를 빼야함
      return {
        width: `${window.innerWidth - sidebarWidth - padding - 2}px`,
        height: `${window.innerHeight - padding}px`,
      };
    });

    await expect(page.getByTestId(`page-${targetIndex}`)).toHaveCSS("width", maximizedSize.width);
    await expect(page.getByTestId(`page-${targetIndex}`)).toHaveCSS("height", maximizedSize.height);

    // 다시 최대화 버튼 클릭 (원래 크기로 복귀)
    await page.getByTestId(`pageMaximizeButton-${targetIndex}`).click();

    await expect(page.getByTestId(`page-${targetIndex}`)).toHaveCSS("width", initialSize.width);
    await expect(page.getByTestId(`page-${targetIndex}`)).toHaveCSS("height", initialSize.height);
  });

  test("페이지 닫기", async ({ page }) => {
    const targetIndex = (await page.locator('[data-testid^="pageItem-"]').count()) - 1;
    await page.getByTestId(`pageCloseButton-${targetIndex}`).click();
    await expect(page.getByTestId(`page-${targetIndex}`)).not.toBeVisible();
  });
});
