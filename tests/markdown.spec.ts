import { test, expect } from "@playwright/test";
import { escape } from "querystring";

const onBoarding = async (page) => {
  await page.click(".hover\\:bg-c_purple\\.600");
  await page.click(".hover\\:bg-c_purple\\.600");
  await page.click(".hover\\:bg-c_purple\\.600");
  await page.click(".hover\\:bg-c_purple\\.600");
  await page.click(".hover\\:bg-c_purple\\.600");
};

test.describe.configure({ mode: "serial" });

test.describe("마크다운 에디터 테스트", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await onBoarding(page);
    await page.getByTestId("addPageButton").click();
    await page.waitForLoadState("networkidle");
    await page.getByTestId("pageItem-0").click();
    expect(page.getByTestId("page-0")).toBeVisible();
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

  test("마크다운 블록 추가", async ({ page }) => {
    // 현재 열린 페이지
    const currentEditor = page.getByTestId("editor-0");
    // 블록 추가 버튼 클릭
    const addNewBlockButton = currentEditor.getByTestId("addNewBlockButton");
    await addNewBlockButton.click();

    // 블록 추가 확인
    await expect(currentEditor.getByTestId("block-0")).toBeVisible();
    // 블록에 포커스 되었는지 확인
    const contentEditable = currentEditor.getByTestId("block-0").getByTestId("contentEditable");
    await contentEditable.click();
    expect(contentEditable).toBeFocused();
  });

  test("페이지 제목 변경", async ({ page }) => {
    const editorTitle = page.getByTestId("editorTitle-0");
    const pageTitle = page.getByTestId("pageTitle-0");
    const sidebarTitle = page.getByTestId("sidebarTitle-0");
    await editorTitle.click();
    await page.keyboard.type("페이지 제목");
    expect(pageTitle).toHaveText("페이지 제목");
    expect(sidebarTitle).toHaveText("페이지 제목");
  });
});

test.describe("마크다운 문법 변환 테스트", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await onBoarding(page);
    await page.getByTestId("addPageButton").click();
    await page.waitForLoadState("networkidle");
    await page.getByTestId("pageItem-0").click();
    expect(page.getByTestId("page-0")).toBeVisible();
    const currentEditor = page.getByTestId("editor-0");
    const addNewBlockButton = currentEditor.getByTestId("addNewBlockButton");
    await addNewBlockButton.click();
    const contentEditable = page.getByTestId("block-0").getByTestId("contentEditable");
    await contentEditable.click();
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

  test("h1 헤더 변환", async ({ page }) => {
    const contentEditable = page.getByTestId("block-0").getByTestId("contentEditable");
    await page.keyboard.type("# 헤더1");
    await expect(contentEditable).toHaveText("헤더1");
    await expect(contentEditable).toHaveClass(/textStyle_display-medium24/);
  });

  test("h2 헤더 변환", async ({ page }) => {
    const contentEditable = page.getByTestId("block-0").getByTestId("contentEditable");
    await page.keyboard.type("## 헤더2");
    await expect(contentEditable).toHaveText("헤더2");
    await expect(contentEditable).toHaveClass(/textStyle_display-medium20/);
  });

  test("h3 헤더 변환", async ({ page }) => {
    const contentEditable = page.getByTestId("block-0").getByTestId("contentEditable");
    await page.keyboard.type("### 헤더3");
    await expect(contentEditable).toHaveText("헤더3");
    await expect(contentEditable).toHaveClass(/textStyle_display-medium16/);
  });

  test("순서 있는 리스트 변환", async ({ page }) => {
    await page.keyboard.type("1. 첫번째");
    await page.keyboard.press("Enter");
    await page.keyboard.type("2. 두번째");
    const blocks = await page.locator('[data-testid^="block-"]').all();
    expect(blocks.length).toBe(2);
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const iconBlock = block.getByTestId("iconBlock").locator("span");
      await expect(iconBlock).toHaveText(`${i + 1}.`);
    }
  });

  test("순서 없는 리스트 변환", async ({ page }) => {
    await page.keyboard.type("- 첫번째");
    await page.keyboard.press("Enter");
    await page.keyboard.type("- 두번째");
    const blocks = await page.locator('[data-testid^="block-"]').all();
    expect(blocks.length).toBe(2);
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const iconBlock = block.getByTestId("iconBlock").locator("span");
      await expect(iconBlock).toHaveText("●");
    }
  });

  test("체크박스 변환", async ({ page }) => {
    const contentEditable = page.getByTestId("block-0").getByTestId("contentEditable");
    await page.keyboard.type("[ ] 체크박스");
    const iconBlock = page.getByTestId("iconBlock").locator("span");
    await expect(iconBlock).toHaveText("");
    await expect(contentEditable).toHaveText("체크박스");
    await iconBlock.click();
    await expect(iconBlock).toHaveText("✓");
  });

  // iconbutton이 없다?
  test("인용구 변환", async ({ page }) => {
    await page.keyboard.type("> 인용구");
    const contentEditable = page.getByTestId("block-0").getByTestId("contentEditable");
    const hasClass = await contentEditable.evaluate((el) => {
      return el.classList.contains("c_gray.500") && el.classList.contains("font-style_italic");
    });
    await expect(contentEditable).toHaveText("인용구");
    expect(hasClass).toBe(true);
  });
});
