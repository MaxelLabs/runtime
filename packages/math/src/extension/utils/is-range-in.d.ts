export declare enum IntervalType {
    OPEN = 0,
    CLOSE = 1,
    LEFT_CLOSE = 2,
    RIGHT_CLOSE = 3
}
export declare function isRangeIn(num: number, min: number, max: number, intervalType?: IntervalType): boolean;
