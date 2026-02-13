import { PointService } from "@/usecase/points";

import { D1PointRepository } from "./repositories/d1/point-repository";
import { D1UserRepository } from "./repositories/d1/user-repository";

const pointRepository = new D1PointRepository();
const userRepository = new D1UserRepository();

export const pointService = new PointService(pointRepository, userRepository);
