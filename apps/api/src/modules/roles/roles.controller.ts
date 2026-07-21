import { FastifyReply } from "fastify";
import { FastifyZodRequest } from "../../@types/fastify";
import { RolesService } from "./roles.service";
import {
  RoleParams,
  CreateRoleBody,
  UpdateRoleBody,
  UpdateRolePermissionsBody,
} from "./roles.schemas";

const rolesService = new RolesService();

export async function listRolesController(
  _request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const roles = await rolesService.listRoles();
  return reply.send({
    success: true,
    data: roles,
  });
}

export async function createRoleController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const body = request.body as CreateRoleBody;
  const role = await rolesService.createRole(body);
  return reply.status(201).send({
    success: true,
    data: role,
  });
}

export async function getRoleController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const params = request.params as RoleParams;
  const role = await rolesService.getRole(params.roleId);
  return reply.send({
    success: true,
    data: role,
  });
}

export async function updateRoleController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const params = request.params as RoleParams;
  const body = request.body as UpdateRoleBody;
  const role = await rolesService.updateRole(params.roleId, body);
  return reply.send({
    success: true,
    data: role,
  });
}

export async function deleteRoleController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const params = request.params as RoleParams;
  const result = await rolesService.deleteRole(params.roleId);
  return reply.send({
    success: true,
    data: result,
  });
}

export async function getRolePermissionsController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const params = request.params as RoleParams;
  const permissions = await rolesService.getRolePermissions(params.roleId);
  return reply.send({
    success: true,
    data: permissions,
  });
}

export async function updateRolePermissionsController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const params = request.params as RoleParams;
  const body = request.body as UpdateRolePermissionsBody;
  const permissions = await rolesService.updateRolePermissions(
    params.roleId,
    body.permissionIds,
  );
  return reply.send({
    success: true,
    data: permissions,
  });
}
