import { test, expect } from "@playwright/test";

const onBoarding = async (page) => {
  await page.click(".hover\\:bg-c_purple\\.600");
  await page.click(".hover\\:bg-c_purple\\.600");
  await page.click(".hover\\:bg-c_purple\\.600");
  await page.click(".hover\\:bg-c_purple\\.600");
  await page.click(".hover\\:bg-c_purple\\.600");
};

const createNewPage = async (page) => {
  const pageListSelector = ".d_flex.pos_relative.gap_lg.ai_center";
  const pageCount = await page.locator(pageListSelector).count();
  if (pageCount === 0) {
    await page.click('[data-onboarding="page-add-button"]');
  }
  await page.waitForSelector(pageListSelector);
};

const openPage = async (page) => {
  await page.click(".d_flex.pos_relative.gap_lg.ai_center");
};

const addNewBlock = async (page) => {
  const blockSelector =
    ".d_flex.gap_spacing\\.sm.bdr_4px.p_spacing\\.sm.c_gray\\.900.op_0\\.8.cursor_pointer";
  await page.click(blockSelector);
  await page.locator(".textStyle_display-medium16");
};

test.describe("마크다운 에디터 테스트", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await onBoarding(page);
  });

  test("페이지 추가", async ({ page }) => {
    await createNewPage(page);
    page.locator(".d_flex.pos_relative.gap_lg.ai_center.w_100%.h_56px.px_md");
  });

  test("마크다운 블록 추가", async ({ page }) => {
    await openPage(page);
    await addNewBlock(page);
    page.locator(".textStyle_display-medium16");
    // // 헤더 테스트
    // await page.keyboard.type("# 헤더1");
    // await page.keyboard.press("Space");
    // await expect(page.locator(".textStyle_display-medium24")).toHaveText("헤더1");
    // await page.keyboard.type("## 헤더2");
    // await page.keyboard.press("Enter");
    // await expect(page.locator(".textStyle_display-medium20")).toHaveText("헤더2");
    // 리스트 테스트
    // 순서 있는 리스트
    // await page.keyboard.type("1. 첫번째");
    // await page.keyboard.press("Enter");
    // await page.keyboard.type("2. 두번째");
    // await expect(page.locator("ol > li")).toHaveCount(2);
    // // 순서 없는 리스트
    // await page.keyboard.type("- 항목1");
    // await page.keyboard.press("Enter");
    // await page.keyboard.type("- 항목2");
    // await expect(page.locator("ul > li")).toHaveCount(2);
    // // 체크박스
    // await page.keyboard.type("- [ ] 할일1");
    // await page.keyboard.press("Enter");
    // await page.keyboard.type("- [x] 완료된 일");
    // const checkboxes = page.locator('input[type="checkbox"]');
    // await expect(checkboxes).toHaveCount(2);
    // // 인용구
    // await page.keyboard.type("> 인용문");
    // await page.keyboard.press("Enter");
    // await expect(page.locator("blockquote")).toHaveText("인용문");
  });

  // test("마크다운 문법 변환 테스트", async ({ page }) => {
  //   await createNewPage(page);
  //   await openPage(page);
  //   await addNewBlock(page);
  //   // 헤더 테스트
  //   await page.keyboard.type("# 헤더1");
  //   await page.keyboard.press("Space");
  //   await expect(page.locator(".textStyle_display-medium24.flex_1_1_auto")).toHaveText("헤더1");
  //   await page.keyboard.type("## 헤더2");
  //   await page.keyboard.press("Enter");
  //   await expect(page.locator(".textStyle_display-medium20.flex_1_1_auto")).toHaveText("헤더2");
  // });
});
