import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Workspace, WorkspaceDocument } from "./schemas/workspace.schema";
import { WorkSpace as CRDTWorkSpace } from "@noctaCrdt/WorkSpace";
import { Model } from "mongoose";
import { Server } from "socket.io";
import {
  CRDTOperation,
  WorkSpaceSerializedProps,
  WorkspaceListItem,
} from "@noctaCrdt/types/Interfaces";
import { Page } from "@noctaCrdt/Page";
import { Block } from "@noctaCrdt/Node";
import { BlockId } from "@noctaCrdt/NodeId";
import { User, UserDocument } from "../auth/schemas/user.schema";

@Injectable()
export class WorkSpaceService implements OnModuleInit {
  private readonly logger = new Logger(WorkSpaceService.name);
  private operationStore: Map<string, CRDTOperation[]>;
  private server: Server;
  constructor(
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  getServer() {
    return this.server;
  }

  // Socket.IO 서버 인스턴스 설정
  setServer(server: Server) {
    this.server = server;
  }

  async onModuleInit() {
    this.operationStore = new Map();

    const guestWorkspaceJSON = await this.workspaceModel.findOne({ id: "guest" });
    if (!guestWorkspaceJSON) {
      const guestWorkspace = await this.workspaceModel.create({
        id: "guest",
        name: "Guest Workspace",
        authUser: { ["guest"]: "owner" },
      });
      this.userModel.updateOne({ id: "guest" }, { $push: { workspaces: guestWorkspace.id } });
    }

    // 주기적으로 인메모리 DB 정리 작업 실행
    setInterval(
      () => {
        this.makeSnapshot();
      },
      process.env.NODE_ENV === "production" ? 10 * 60 * 1000 : 30 * 1000,
    );
  }

  async clearDeletedObject(workspace: CRDTWorkSpace): Promise<CRDTWorkSpace> {
    const newWorkspace = workspace;
    newWorkspace.pageList.forEach((page) => {
      page.crdt.LinkedList.spread().forEach((block) => {
        if (block.deleted) return;
        block.crdt.LinkedList.clearDeletedNode();
      });
      page.crdt.LinkedList.clearDeletedNode();
    });
    return newWorkspace;
  }

  async getWorkspace(workspaceId: string): Promise<CRDTWorkSpace> {
    // DB에서 찾기
    const workspaceJSON = await this.workspaceModel.findOne({ id: workspaceId });

    if (!workspaceJSON) {
      throw new Error(`workspaceJson ${workspaceId} not found`);
    }
    const workspace = new CRDTWorkSpace();

    if (workspaceJSON) {
      // DB에 있으면 JSON을 객체로 복원
      workspace.deserialize({
        id: workspaceJSON.id,
        pageList: workspaceJSON.pageList,
        authUser: workspaceJSON.authUser,
      } as WorkSpaceSerializedProps);
    }

    return workspace;
  }

  async updateWorkspace(workspace: CRDTWorkSpace) {
    const serializedData = workspace.serialize();

    // 스키마에 맞게 데이터 변환
    const workspaceData = {
      id: serializedData.id,
      name: workspace.name,
      pageList: serializedData.pageList,
      authUser: serializedData.authUser,
      updatedAt: new Date(),
    };

    await this.workspaceModel.updateOne(
      { id: workspaceData.id },
      { $set: workspaceData },
      { upsert: true },
    );
  }

  async getPage(workspaceId: string, pageId: string): Promise<Page> {
    return (await this.getWorkspace(workspaceId)).pageList.find((page) => page.id === pageId);
  }

  async getPageIndex(workspaceId: string, pageId: string): Promise<number> {
    return (await this.getWorkspace(workspaceId)).pageList.findIndex((page) => page.id === pageId);
  }

  async getBlock(workspaceId: string, pageId: string, blockId: BlockId): Promise<Block> {
    const page = await this.getPage(workspaceId, pageId);
    if (!page) {
      throw new Error(`Page with id ${pageId} not found`);
    }
    return page.crdt.LinkedList.nodeMap[JSON.stringify(blockId)];
  }
  async getUserRole(userId: string, workspaceId: string): Promise<string> {
    const workspaces = await this.getUserWorkspaces(userId);
    const workspace = workspaces.find((ws) => ws.id === workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found or user not a member");
    }
    return workspace.role;
  }
  async updateWorkspaceName(workspaceId: string, newName: string): Promise<void> {
    try {
      // 메모리에서 워크스페이스 찾기
      const workspace = await this.getWorkspace(workspaceId);
      if (!workspace) {
        throw new Error(`Workspace with id ${workspaceId} not found`);
      }

      // 메모리상의 워크스페이스 이름 업데이트
      workspace.name = newName;

      // MongoDB 업데이트
      const result = await this.workspaceModel.findOneAndUpdate(
        { id: workspaceId },
        { $set: { name: newName } },
        { new: true },
      );

      if (!result) {
        throw new Error(`Failed to update workspace name in database`);
      }

      this.logger.log(`Workspace ${workspaceId} name updated to: ${newName}`);
    } catch (error) {
      this.logger.error(`Failed to update workspace name: ${error.message}`);
      throw error;
    }
  }

  async getWorkspaceMembers(workspaceId: string): Promise<string[]> {
    try {
      // 워크스페이스 데이터를 DB에서 조회
      const workspaceData = await this.workspaceModel.findOne({ id: workspaceId });
      if (!workspaceData) {
        throw new Error(`Workspace with id ${workspaceId} not found`);
      }
      // authUser Map에서 모든 유저 ID를 배열로 변환하여 반환
      // authUser는 Map<string, string> 형태로 userId와 role을 저장하고 있음
      // return Array.from(workspaceData.authUser.keys());
      const members = await this.userModel.find({ workspaces: workspaceId }).select("id");
      return members.map((member) => member.id);
    } catch (error) {
      this.logger.error(`Failed to get workspace members: ${error.message}`);
      throw error;
    }
  }
  // 워크스페이스 생성
  async createWorkspace(userId: string, name: string): Promise<Workspace> {
    const newWorkspace = await this.workspaceModel.create({
      name,
      authUser: { [userId]: "owner" },
    });
    //    newWorkspace.authUser[userId]
    // 유저 정보 업데이트
    await this.userModel.updateOne({ id: userId }, { $push: { workspaces: newWorkspace.id } });

    return newWorkspace;
  }

  // 워크스페이스 삭제
  async deleteWorkspace(userId: string, workspaceId: string): Promise<void> {
    const workspace = await this.workspaceModel.findOne({ id: workspaceId });

    if (!workspace) {
      throw new Error(`Workspace with id ${workspaceId} not found`);
    }

    // 권한 확인
    if (!workspace.authUser.has(userId) || workspace.authUser.get(userId) !== "owner") {
      throw new Error(`User ${userId} does not have permission to delete this workspace`);
    }

    // 관련 유저들의 workspaces 목록 업데이트
    await this.userModel.updateMany(
      { workspaces: workspaceId },
      { $pull: { workspaces: workspaceId } },
    );

    await this.workspaceModel.deleteOne({ id: workspaceId });
  }

  async getUserWorkspaces(userId: string): Promise<WorkspaceListItem[]> {
    if (userId === "guest") {
      return [
        {
          id: "guest",
          name: "Guest Workspace",
          role: "editor",
          memberCount: 0,
          activeUsers: 0,
        },
      ];
    }

    const user = await this.userModel.findOne({ id: userId });
    if (!user) {
      return [];
    }

    const workspaces = await this.workspaceModel.find({
      id: { $in: user.workspaces },
    });
    const workspaceList = await Promise.all(
      workspaces.map(async (workspace) => {
        const room = this.getServer().sockets.adapter.rooms.get(workspace.id);
        const role = workspace.authUser[userId] || "editor";

        // users 컬렉션에서 멤버 수 조회
        const memberCount = await this.userModel.countDocuments({
          workspaces: workspace.id,
        });

        return {
          id: workspace.id,
          name: workspace.name,
          role,
          memberCount,
          activeUsers: room?.size || 0,
        };
      }),
    );
    return workspaceList;
  }

  async inviteUserToWorkspace(
    ownerId: string,
    workspaceId: string,
    invitedUserId: string,
  ): Promise<void> {
    const workspace = await this.workspaceModel.findOne({ id: workspaceId });

    if (!workspace) {
      throw new Error(`Workspace with id ${workspaceId} not found`);
    }

    // 권한 확인 - 객체의 속성 접근 방식으로 변경
    if (!(ownerId in workspace.authUser) || workspace.authUser[ownerId] !== "owner") {
      throw new Error(`User ${ownerId} does not have permission to invite users to this workspace`);
    }

    // 워크스페이스에 유저 추가 - 객체 속성 할당 방식으로 변경
    if (!(invitedUserId in workspace.authUser)) {
      // 일반 객체 업데이트
      workspace.authUser[invitedUserId] = "editor";
      await workspace.save();

      // 유저 정보 업데이트
      await this.userModel.updateOne(
        { id: invitedUserId },
        { $addToSet: { workspaces: workspaceId } },
      );
    }
  }

  storeOperation(workspaceId: string, operation: CRDTOperation): void {
    if (!this.operationStore.has(workspaceId)) {
      this.operationStore.set(workspaceId, []);
    }
    this.operationStore.get(workspaceId).push(operation);
  }

  async playOperationToPage(page: Page, operation: CRDTOperation): Promise<void> {
    try {
      switch (operation.type) {
        case "blockInsert":
          page.crdt.remoteInsert(operation);
          break;
        case "blockUpdate":
          page.crdt.remoteUpdate(operation.node, operation.pageId);
          page.crdt.LinkedList.updateAllOrderedListIndices();
          break;
        case "blockDelete":
          page.crdt.remoteDelete(operation);
          page.crdt.LinkedList.updateAllOrderedListIndices();
          break;
        case "blockReorder":
          page.crdt.remoteReorder(operation);
          page.crdt.LinkedList.updateAllOrderedListIndices();
          break;
        case "blockCheckbox":
          page.crdt.LinkedList.nodeMap[JSON.stringify(operation.blockId)].isChecked =
            operation.isChecked;
          break;
        case "charInsert":
          page.crdt.LinkedList.nodeMap[JSON.stringify(operation.blockId)].crdt.remoteInsert(
            operation,
          );
          break;
        case "charDelete":
          page.crdt.LinkedList.nodeMap[JSON.stringify(operation.blockId)].crdt.remoteDelete(
            operation,
          );
          break;
        case "charUpdate":
          page.crdt.LinkedList.nodeMap[JSON.stringify(operation.blockId)].crdt.remoteUpdate(
            operation,
          );
          break;
        default:
        // this.logger.warn("연산 처리 중 알 수 없는 연산 발견:", operation);
      }
    } catch (error) {
      // this.logger.warn("유효하지 않은 연산:");
    }
  }

  async playOperationToWorkspace(
    workspace: CRDTWorkSpace,
    operation: CRDTOperation,
  ): Promise<void> {
    this.playOperationToPage(
      workspace.pageList.find((page) => page.id === operation.pageId),
      operation,
    );
  }

  async playAllOperations(workspace: CRDTWorkSpace, operations: CRDTOperation[]): Promise<void> {
    await Promise.all(
      operations.map(async (operation) => {
        this.playOperationToWorkspace(workspace, operation);
      }),
    );
  }

  async updatePage(workspaceId: string, pageId: string) {
    const page = await this.getPage(workspaceId, pageId);
    if (!page) {
      throw new Error(`Page with id ${pageId} not found`);
    }

    const operations = this.operationStore.get(workspaceId) || [];
    const pageOperations = operations.filter((op) => op.pageId === pageId);

    for (const operation of pageOperations) {
      await this.playOperationToPage(page, operation);
    }

    return page;
  }

  async makeSnapshot(): Promise<void> {
    const bulkOps = [];
    const tasks = [];

    this.operationStore.forEach((operations, workspaceId) => {
      tasks.push(
        (async () => {
          // DB에서 찾기
          const workspaceJSON = await this.workspaceModel.findOne({ id: workspaceId });
          if (!workspaceJSON) {
            throw new Error(`workspaceJson ${workspaceId} not found`);
          }

          const workspace = new CRDTWorkSpace();
          workspace.deserialize({
            id: workspaceJSON.id,
            pageList: workspaceJSON.pageList,
            authUser: workspaceJSON.authUser,
          } as WorkSpaceSerializedProps);

          await this.playAllOperations(workspace, operations);

          const newWorkspace = await this.clearDeletedObject(workspace);
          const serializedData = newWorkspace.serialize();
          const workspaceData = {
            id: workspaceId,
            name: workspace.name,
            pageList: serializedData.pageList,
            authUser: serializedData.authUser,
            updatedAt: new Date(),
          };

          bulkOps.push({
            updateOne: {
              filter: { id: workspaceId },
              update: { $set: workspaceData },
              upsert: true,
            },
          });
        })(),
      );
    });

    // 모든 작업이 끝날 때까지 대기
    await Promise.all(tasks);

    if (bulkOps.length > 0) {
      await this.workspaceModel.bulkWrite(bulkOps, { ordered: false });
    }

    this.operationStore.clear();
    this.logger.log(`Snapshot 저장 완료`);
  }
}
