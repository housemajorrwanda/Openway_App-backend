import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { RoadClosureService } from './road-closure.service';
import { CreateRoadClosureDto } from './dto/create-road-closure.dto';
import { UpdateRoadClosureDto } from './dto/update-road-closure.dto';

@ApiTags('Road Closures')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('road-closures')
export class RoadClosureController {
  constructor(private readonly service: RoadClosureService) {}

  // ─── Public (any authenticated user) ──────────────────────────────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get active/upcoming road closures',
    description: 'Returns all active and upcoming road closures for display on the map.',
  })
  @ApiResponse({ status: 200, description: 'List of active/upcoming road closures' })
  getActive() {
    return this.service.getActive();
  }

  // ─── Admin only ───────────────────────────────────────────────────────────

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Get all road closures including resolved' })
  getAll() {
    return this.service.getAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[Admin] Create a road closure' })
  @ApiResponse({ status: 201, description: 'Created road closure' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRoadClosureDto,
  ) {
    return this.service.create(user.sub, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Update a road closure' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoadClosureDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Delete a road closure' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
