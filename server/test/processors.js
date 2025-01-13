// processors.js
module.exports = {
  handlePageCreation,
  generateCharData,
  handleCharInsertion,
};
function handlePageCreation(userContext, events, done) {
  let doneCalled = false;
  let timeoutId;

  const socket = userContext.sockets[""];

  // 먼저 모든 가능한 응답 이벤트에 대한 리스너를 설정
  socket.on("create/page", (response) => {
    console.log("Received create/page response:", response);
    if (response && response.page && response.page.id) {
      handleSuccess(response.page.id);
    }
  });

  socket.on("workspace", (response) => {
    console.log("Received workspace response:", response);
    if (response && response.id) {
      handleSuccess(response.id);
    }
  });

  // 성공 처리를 위한 헬퍼 함수
  function handleSuccess(pageId) {
    if (!doneCalled) {
      userContext.vars.pageId = pageId;
      console.log("Successfully captured page ID:", pageId);
      doneCalled = true;
      clearTimeout(timeoutId);
      done();
    }
  }

  // 이벤트 리스너 설정 후 emit 실행
  console.log("Emitting create/page event...");
  socket.emit("create/page", {
    type: "pageCreate",
    workspaceId: "guest",
    clientId: 3,
  });

  // 타임아웃 설정 (시간을 좀 더 길게 설정)
  timeoutId = setTimeout(() => {
    if (!doneCalled) {
      console.error("[ERROR] Page creation timed out - No response received after 10 seconds");
      doneCalled = true;
      done(new Error("Operation timed out"));
    }
  }, 5000); // 10초로 연장
}

const pageNodeTrackers = new Map();

function generateCharData(userContext, events, done) {
  const pageId = userContext.vars.pageId;

  // 페이지별 노드 추적기 초기화
  if (!pageNodeTrackers.has(pageId)) {
    pageNodeTrackers.set(pageId, {
      lastNode: null,
      firstNode: null,
    });
  }
  const nodeTracker = pageNodeTrackers.get(pageId);

  const clock = Date.now() % 100000;

  // 새로운 문자 노드 생성
  const charNode = {
    id: {
      clock: clock,
      client: 3,
    },
    value: String.fromCharCode(65 + Math.floor(Math.random() * 26)),
    next: null, // 다음에 연결될 노드
    prev: nodeTracker.lastNode ? nodeTracker.lastNode.id : null, // 이전 노드의 ID
    style: [],
    color: "black",
    backgroundColor: "transparent",
  };

  // 첫 번째 노드인 경우 저장
  if (!nodeTracker.firstNode) {
    nodeTracker.firstNode = charNode;
  }

  // 이전 노드가 있는 경우, 해당 노드의 next를 현재 노드로 설정
  if (nodeTracker.lastNode) {
    nodeTracker.lastNode.next = charNode.id;
  }

  // 현재 노드를 마지막 노드로 저장
  nodeTracker.lastNode = charNode;

  userContext.vars.charNode = charNode;
  return done();
}

// 문자 입력 처리를 위한 새로운 함수
function handleCharInsertion(userContext, events, done) {
  const socket = userContext.sockets[""];

  // 문자 입력 이벤트 리스너 설정
  socket.on("insert/char", (response) => {
    console.log("Character inserted:", response);
  });

  done();
}
