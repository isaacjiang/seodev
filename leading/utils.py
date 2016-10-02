from datetime import datetime


def latlngsEqual(latlngs1, latlngs2, distance=0):
    if type(latlngs1) is list:
        latlngs1 = {"lat": float(latlngs1[0]), "lng": float(latlngs1[1])}
    if type(latlngs2) is list:
        latlngs2 = {"lat": float(latlngs2[0]), "lng": float(latlngs2[1])}
    f = "{:10." + str(distance) + "f}"
    # print type(latlngs1['lat']),type(latlngs2['lat']),latlngs1['lng'] , type(latlngs2['lng'])
    if f.format(float(latlngs1['lat'])) == f.format(float(latlngs2['lat'])) and f.format(
            float(latlngs1['lng'])) == f.format(
            float(latlngs2['lng'])):
        return True
    else:
        return False


def dateConverter(strDateJS):
    # strDate formart like  ('%Y-%m-%d %H:%M:%S') to microseconds
    dt = str(strDateJS).split('T')
    # print dt
    if len(dt) == 1:
        dt = str(strDateJS).split()
    d = dt[0].split('-')
    # ts = dt[1].split('.')
    # t = ts[0].split(':')
    return datetime(int(d[0]), int(d[1]), int(d[2]))
